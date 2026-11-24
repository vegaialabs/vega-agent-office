create schema agent_office_private;
revoke all on schema agent_office_private from public, anon, authenticated;
grant usage on schema agent_office_private to authenticated;
create table public.tasks (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (char_length(btrim(title)) between 1 and 120),
 status text not null default 'backlog' check(status in ('backlog','development','testing','done')),
 revision integer not null default 0 check(revision>=0),
 cycles integer not null default 0 check(cycles>=0),
 events jsonb not null default '[]'::jsonb check(jsonb_typeof(events)='array'),
 created_at timestamptz not null default now()
);
create index tasks_owner_idx on public.tasks(owner_id,created_at);
alter table public.tasks enable row level security;
revoke all on public.tasks from public, anon, authenticated;
grant select on public.tasks to authenticated;
create policy read_own on public.tasks for select to authenticated using ((select auth.uid())=owner_id);
-- RPCs enforce ownership and workflow. No direct client writes.
create function agent_office_private.create_task(p_title text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); t public.tasks;
begin
 if u is null then raise exception 'Authentication required'; end if;
 if p_title is null or char_length(btrim(p_title)) not between 1 and 120 then raise exception 'Invalid title'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 if (select count(*) from public.tasks where owner_id=u)>=100 then raise exception 'Task limit reached'; end if;
 insert into public.tasks(owner_id,title) values(u,btrim(p_title)) returning * into t;
 return to_jsonb(t)-'owner_id';
end; $$;
create function agent_office_private.transition_task(p_id uuid,p_action text,p_note text,p_revision integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); t public.tasks; target text; actor text;
begin
 if u is null then raise exception 'Authentication required'; end if;
 select * into t from public.tasks where id=p_id and owner_id=u for update;
 if not found then raise exception 'Task not found'; end if;
 if p_revision is distinct from t.revision then raise exception 'Stale revision; reload'; end if;
 if t.revision>=100 then raise exception 'Revision limit reached'; end if;
 if p_note is null or char_length(p_note)>1000 then raise exception 'Invalid note'; end if;
 target := case when t.status='backlog' and p_action='assign' then 'development'
 when t.status='development' and p_action='submit' then 'testing'
 when t.status='testing' and p_action='pass' then 'done'
 when t.status='testing' and p_action='fail' then 'development' end;
 if target is null then raise exception 'Invalid transition'; end if;
 if p_action in ('pass','fail') and char_length(btrim(p_note))=0 then raise exception 'Evidence required'; end if;
 actor := case t.status when 'backlog' then 'orchestrator' when 'development' then 'develop' else 'testing' end;
 update public.tasks set status=target,revision=revision+1,cycles=cycles+case when p_action='fail' then 1 else 0 end,
 events=events||jsonb_build_array(jsonb_build_object('role',actor,'action',p_action,'note',btrim(p_note),'at',now()))
 where id=p_id and owner_id=u returning * into t;
 return to_jsonb(t)-'owner_id';
end; $$;
create function public.create_task(p_title text) returns jsonb
language sql security invoker set search_path = '' as $$ select agent_office_private.create_task(p_title); $$;
create function public.transition_task(p_id uuid,p_action text,p_note text,p_revision integer) returns jsonb
language sql security invoker set search_path = '' as $$ select agent_office_private.transition_task(p_id,p_action,p_note,p_revision); $$;
revoke all on all functions in schema agent_office_private from public, anon, authenticated;
grant execute on function agent_office_private.create_task(text), agent_office_private.transition_task(uuid,text,text,integer) to authenticated;
revoke all on function public.create_task(text), public.transition_task(uuid,text,text,integer) from public, anon, authenticated;
grant execute on function public.create_task(text), public.transition_task(uuid,text,text,integer) to authenticated;
