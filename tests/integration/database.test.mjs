import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
const name=`agent-office-test-${process.pid}`;
const docker=(args,input)=>execFileSync('docker',args,{input,encoding:'utf8',stdio:['pipe','pipe','pipe']});
test('isolated PostgreSQL: migrations, RLS, grants, workflow and ownership',async()=>{
 try{
 docker(['run','--detach','--rm','--name',name,'--network','none','-e','POSTGRES_HOST_AUTH_METHOD=trust','postgres:18-alpine']);
 // The image's initialization server listens on a Unix socket only. TCP becomes
 // available when the final server starts, avoiding the initialization shutdown race.
 let ready=false;for(let i=0;i<30;i++){try{docker(['exec',name,'pg_isready','-h','127.0.0.1','-U','postgres']);ready=true;break;}catch{await new Promise(r=>setTimeout(r,500));}}assert.ok(ready,'isolated PostgreSQL ready');
 const setup="create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;";
 const migrations=readdirSync('supabase/migrations').sort().map(f=>readFileSync(`supabase/migrations/${f}`,'utf8')).join('\n');
 const sql=setup+'\n'+migrations+'\n'+readFileSync('tests/integration/assertions.sql','utf8');
 const output=docker(['exec','-i',name,'psql','-h','127.0.0.1','-U','postgres','-v','ON_ERROR_STOP=1'],sql);assert.match(output,/SQL_ASSERTIONS_OK/);
 }finally{try{docker(['stop',name]);}catch{}}
});
