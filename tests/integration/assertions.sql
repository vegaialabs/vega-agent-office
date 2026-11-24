insert into auth.users values('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
do $$
declare p uuid; t jsonb; foreign_task uuid;
begin
 p:=(public.create_project('First')->>'id')::uuid;
 t:=public.create_task('Task',p);
 perform set_config('test.task',t->>'id',false);
 perform set_config('test.project',p::text,false);
 begin perform public.transition_task((t->>'id')::uuid,'pass','invalid',0); raise exception 'TEST direct completion allowed'; exception when others then if sqlerrm like 'TEST%' then raise; end if; end;
 t:=public.transition_task((t->>'id')::uuid,'assign','',0);
 begin perform public.transition_task((t->>'id')::uuid,'submit','',0); raise exception 'TEST stale allowed'; exception when others then if sqlerrm like 'TEST%' then raise; end if; end;
 t:=public.transition_task((t->>'id')::uuid,'submit','',1);
 begin perform public.transition_task((t->>'id')::uuid,'pass','',2); raise exception 'TEST empty evidence allowed'; exception when others then if sqlerrm like 'TEST%' then raise; end if; end;
 declare
  blank text;
 begin
  foreach blank in array array[E'\t\n',E'\r',U&'\00A0',U&'\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF'] loop
   begin perform public.create_project(blank); raise exception 'TEST whitespace project allowed'; exception when others then if sqlerrm like 'TEST%' then raise; end if; end;
   begin perform public.create_task(blank,p); raise exception 'TEST whitespace title allowed'; exception when others then if sqlerrm like 'TEST%' then raise; end if; end;
   begin perform public.create_task(blank); raise exception 'TEST whitespace legacy title allowed'; exception when others then if sqlerrm like 'TEST%' then raise; end if; end;
   begin perform public.transition_task((t->>'id')::uuid,'pass',blank,2); raise exception 'TEST whitespace pass evidence allowed'; exception when others then if sqlerrm like 'TEST%' then raise; end if; end;
   begin perform public.transition_task((t->>'id')::uuid,'fail',blank,2); raise exception 'TEST whitespace fail evidence allowed'; exception when others then if sqlerrm like 'TEST%' then raise; end if; end;
  end loop;
 end;
 t:=public.transition_task((t->>'id')::uuid,'fail','reproduced',2);
 t:=public.transition_task((t->>'id')::uuid,'submit','fixed',3);
 t:=public.transition_task((t->>'id')::uuid,'pass','verified',4);
 if t->>'status'<>'done' or (t->>'cycles')::int<>1 or jsonb_array_length(t->'events')<>5 then raise exception 'TEST workflow mismatch'; end if;
 begin update public.tasks set status='done'; raise exception 'TEST direct update allowed'; exception when insufficient_privilege then null; end;
 begin insert into public.projects(owner_id,name) values(auth.uid(),'forged'); raise exception 'TEST direct project insert allowed'; exception when insufficient_privilege then null; end;
 begin perform public.create_project(''); raise exception 'TEST invalid name allowed'; exception when others then if sqlerrm like 'TEST%' then raise; end if; end;
 begin perform public.create_task('',p); raise exception 'TEST invalid title allowed'; exception when others then if sqlerrm like 'TEST%' then raise; end if; end;
end;$$;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
do $$begin
 if exists(select 1 from public.tasks) or exists(select 1 from public.projects) then raise exception 'TEST cross-user read'; end if;
 begin perform public.transition_task(current_setting('test.task')::uuid,'assign','',0); raise exception 'TEST cross-user transition'; exception when others then if sqlerrm like 'TEST%' then raise; end if; end;
 begin perform public.create_task('foreign',current_setting('test.project')::uuid); raise exception 'TEST cross-user project'; exception when others then if sqlerrm like 'TEST%' then raise; end if; end;
 perform public.create_task('Legacy RPC');
 if(select count(*) from public.tasks)<>1 then raise exception 'TEST legacy create failed'; end if;
end;$$;
reset role;
set role anon;
do $$begin
 begin perform public.create_project('unauthenticated'); raise exception 'TEST anon RPC allowed'; exception when insufficient_privilege then null; end;
end;$$;
select 'SQL_ASSERTIONS_OK';
