export const states = Object.freeze(['backlog','development','testing','done']);
export const roles = Object.freeze({backlog:'orchestrator',development:'develop',testing:'testing',done:'orchestrator'});
export function transition(task, action, note = '') {
  if (!task || !states.includes(task.status)) throw new Error('Estado inválido');
  const map = {backlog:{assign:'development'},development:{submit:'testing'},testing:{pass:'done',fail:'development'},done:{}};
  const next = Object.hasOwn(map[task.status],action) ? map[task.status][action] : undefined;
  if (!next) throw new Error('Transición no permitida');
  if (!Number.isInteger(task.revision) || task.revision < 0 || task.revision >= 100) throw new Error('Límite de revisiones alcanzado');
  if (typeof note !== 'string' || note.length > 1000) throw new Error('Nota inválida');
  if (['pass','fail'].includes(action) && !note.trim()) throw new Error('Testing requiere evidencias');
  return {...task,status:next,revision:task.revision+1,cycles:task.cycles+(action==='fail'?1:0),events:[...task.events,{role:roles[task.status],action,note:note.trim(),at:new Date().toISOString()}]};
}
export function newTask(title, id=globalThis.crypto.randomUUID()) {
  if(typeof title!=='string'||!title.trim()||title.trim().length>120) throw new Error('Título de 1 a 120 caracteres');
  return {id,title:title.trim(),status:'backlog',revision:0,cycles:0,events:[]};
}
export function metrics(tasks) {
  const done=tasks.filter(t=>t.status==='done').length;
  return {total:tasks.length,done,progress:tasks.length?Math.round(done/tasks.length*100):0,cycles:tasks.reduce((sum,t)=>sum+t.cycles,0)};
}
