-- Additive upgrade: preserve tasks and the legacy one-argument RPC for old deployments.
create table public.projects (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(char_length(btrim(name)) between 1 and 80),
 created_at timestamptz not null default now(),
 unique(id,owner_id)
);
create index projects_owner_idx on public.projects(owner_id,created_at);
alter table public.projects enable row level security;
revoke all on public.projects from public,anon,authenticated;
grant select on public.projects to authenticated;
create policy read_own on public.projects for select to authenticated using((select auth.uid())=owner_id);
insert into public.projects(owner_id,name) select distinct owner_id,'Proyecto inicial' from public.tasks;
alter table public.tasks add column project_id uuid;
update public.tasks t set project_id=p.id from public.projects p where p.owner_id=t.owner_id;
alter table public.tasks alter column project_id set not null;
alter table public.tasks add constraint tasks_project_owner_fk foreign key(project_id,owner_id) references public.projects(id,owner_id) on delete cascade;
create index tasks_project_idx on public.tasks(project_id,created_at);
create function agent_office_private.create_project(p_name text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); p public.projects;
begin
 if u is null then raise exception 'Authentication required'; end if;
 if p_name is null or char_length(btrim(p_name)) not between 1 and 80 then raise exception 'Invalid project name'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 if(select count(*) from public.projects where owner_id=u)>=20 then raise exception 'Project limit reached'; end if;
 insert into public.projects(owner_id,name) values(u,btrim(p_name)) returning * into p;
 return to_jsonb(p)-'owner_id';
end;$$;
create function agent_office_private.create_task(p_title text,p_project_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); t public.tasks;
begin
 if u is null then raise exception 'Authentication required'; end if;
 if p_title is null or char_length(btrim(p_title)) not between 1 and 120 then raise exception 'Invalid title'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 if not exists(select 1 from public.projects where id=p_project_id and owner_id=u) then raise exception 'Project not found'; end if;
 if(select count(*) from public.tasks where owner_id=u)>=100 then raise exception 'Task limit reached'; end if;
 insert into public.tasks(owner_id,project_id,title) values(u,p_project_id,btrim(p_title)) returning * into t;
 return to_jsonb(t)-'owner_id';
end;$$;
create or replace function agent_office_private.create_task(p_title text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); project uuid;
begin
 if u is null then raise exception 'Authentication required'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 select id into project from public.projects where owner_id=u order by created_at,id limit 1;
 if project is null then project:=(agent_office_private.create_project('Proyecto inicial')->>'id')::uuid; end if;
 return agent_office_private.create_task(p_title,project);
end;$$;
create function public.create_project(p_name text) returns jsonb language sql security invoker set search_path='' as $$select agent_office_private.create_project(p_name);$$;
create function public.create_task(p_title text,p_project_id uuid) returns jsonb language sql security invoker set search_path='' as $$select agent_office_private.create_task(p_title,p_project_id);$$;
revoke all on function agent_office_private.create_project(text),agent_office_private.create_task(text,uuid),public.create_project(text),public.create_task(text,uuid) from public,anon,authenticated;
grant execute on function agent_office_private.create_project(text),agent_office_private.create_task(text,uuid),public.create_project(text),public.create_task(text,uuid) to authenticated;
