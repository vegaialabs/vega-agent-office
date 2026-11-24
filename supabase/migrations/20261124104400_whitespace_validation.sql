-- ECMAScript String.trim whitespace, explicit and independent of database locale.
create function agent_office_private.js_trim(value text) returns text
language sql immutable strict security invoker set search_path='' as $$
 select pg_catalog.btrim(value, U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF');
$$;
revoke all on function agent_office_private.js_trim(text) from public,anon,authenticated;
create or replace function agent_office_private.create_project(p_name text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); p public.projects;
begin
 if u is null then raise exception 'Authentication required'; end if;
 if p_name is null or char_length(agent_office_private.js_trim(p_name)) not between 1 and 80 then raise exception 'Invalid project name'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 if(select count(*) from public.projects where owner_id=u)>=20 then raise exception 'Project limit reached'; end if;
 insert into public.projects(owner_id,name) values(u,agent_office_private.js_trim(p_name)) returning * into p;
 return to_jsonb(p)-'owner_id';
end;$$;

create or replace function agent_office_private.create_task(p_title text,p_project_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); t public.tasks;
begin
 if u is null then raise exception 'Authentication required'; end if;
 if p_title is null or char_length(agent_office_private.js_trim(p_title)) not between 1 and 120 then raise exception 'Invalid title'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0));
 if not exists(select 1 from public.projects where id=p_project_id and owner_id=u) then raise exception 'Project not found'; end if;
 if(select count(*) from public.tasks where owner_id=u)>=100 then raise exception 'Task limit reached'; end if;
 insert into public.tasks(owner_id,project_id,title) values(u,p_project_id,agent_office_private.js_trim(p_title)) returning * into t;
 return to_jsonb(t)-'owner_id';
end;$$;

create or replace function agent_office_private.transition_task(p_id uuid,p_action text,p_note text,p_revision integer) returns jsonb
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
 if p_action in ('pass','fail') and char_length(agent_office_private.js_trim(p_note))=0 then raise exception 'Evidence required'; end if;
 actor := case t.status when 'backlog' then 'orchestrator' when 'development' then 'develop' else 'testing' end;
 update public.tasks set status=target,revision=revision+1,cycles=cycles+case when p_action='fail' then 1 else 0 end,
 events=events||jsonb_build_array(jsonb_build_object('role',actor,'action',p_action,'note',agent_office_private.js_trim(p_note),'at',now()))
 where id=p_id and owner_id=u returning * into t;
 return to_jsonb(t)-'owner_id';
end; $$;
