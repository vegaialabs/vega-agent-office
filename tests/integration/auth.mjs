// Explicit dedicated-test configuration only; never falls back to production env.
import {createClient} from '@supabase/supabase-js';
import assert from 'node:assert/strict';
const url=process.env.TEST_SUPABASE_URL,key=process.env.TEST_SUPABASE_PUBLISHABLE_KEY;
if(!url||!key||process.env.TEST_SUPABASE_CONFIRMED_ISOLATED!=='yes'){
 console.error('BLOCKED: dedicated TEST_SUPABASE_URL, TEST_SUPABASE_PUBLISHABLE_KEY and TEST_SUPABASE_CONFIRMED_ISOLATED=yes required.');process.exit(2);
}
const clients=[0,1].map(()=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}));
for(let i=0;i<2;i++){const {error}=await clients[i].auth.signInAnonymously({options:{captchaToken:process.env[`TEST_CAPTCHA_TOKEN_${i+1}`]}});assert.ifError(error);}
const {data:project,error:pe}=await clients[0].rpc('create_project',{p_name:'Auth isolation test'});assert.ifError(pe);
const {data:task,error:te}=await clients[0].rpc('create_task',{p_title:'Isolation',p_project_id:project.id});assert.ifError(te);
const foreign=await clients[1].from('tasks').select('id').eq('id',task.id);assert.ifError(foreign.error);assert.equal(foreign.data.length,0);
const denied=await clients[1].rpc('transition_task',{p_id:task.id,p_action:'assign',p_note:'',p_revision:0});assert.ok(denied.error);
const session=await clients[0].auth.getSession();const reload=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});assert.ifError((await reload.auth.setSession(session.data.session)).error);
const persisted=await reload.from('tasks').select('id').eq('id',task.id);assert.ifError(persisted.error);assert.equal(persisted.data.length,1);
for(const client of [...clients,reload])await client.auth.signOut();console.log('PASS: two actual anonymous sessions isolated; session restored and data persisted. Test records retained in dedicated disposable project.');
