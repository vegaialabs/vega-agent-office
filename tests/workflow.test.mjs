import test from 'node:test';
import assert from 'node:assert/strict';
import {newTask,transition,metrics,states} from '../lib/workflow.mjs';
const start=()=>newTask('  Feature  ','test');
const review=()=>transition(transition(start(),'assign'),'submit');
test('creates a normalized task',()=>{assert.equal(start().title,'Feature');assert.equal(start().status,'backlog');assert.equal(start().revision,0)});
test('invalid titles rejected',()=>{for(const title of ['', '   ', 'x'.repeat(121),null])assert.throws(()=>newTask(title))});
test('complete workflow including rejected review',()=>{const t=review();const f=transition(t,'fail','Build failed');const end=transition(transition(f,'submit'),'pass','Regression passed');assert.equal(end.status,'done');assert.equal(end.cycles,1);assert.equal(end.revision,5);assert.deepEqual(end.events.map(e=>e.role),['orchestrator','develop','testing','develop','testing']);assert.equal(t.events.length,2)});
test('only explicitly allowed transitions accepted',()=>{const allowed={backlog:['assign'],development:['submit'],testing:['pass','fail'],done:[]};for(const status of states)for(const action of ['assign','submit','pass','fail','toString','__proto__']){const fn=()=>transition({...start(),status},action,'Evidence');if(allowed[status].includes(action))assert.doesNotThrow(fn);else assert.throws(fn)}});
test('testing requires evidence and notes are bounded',()=>{for(const action of ['pass','fail'])for(const note of ['', '  ','x'.repeat(1001)])assert.throws(()=>transition(review(),action,note))});
test('metrics handle empty and mixed queues',()=>{assert.deepEqual(metrics([]),{total:0,done:0,progress:0,cycles:0});assert.deepEqual(metrics([start(),transition(review(),'pass','ok'),transition(review(),'fail','bad')]),{total:3,done:1,progress:33,cycles:1})});

test('revision limit matches database contract',()=>{assert.throws(()=>transition({...start(),revision:100},'assign'));assert.equal(transition({...start(),revision:99},'assign').revision,100);assert.throws(()=>transition({...start(),revision:-1},'assign'))});
