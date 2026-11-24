import {type Task,type Status,type Action} from '../lib/workflow.mjs';
const desks:{role:string;initial:string;status:Status;description:string}[]=[
 {role:'Orchestrator',initial:'O',status:'backlog',description:'Planificación y asignación'},
 {role:'Develop',initial:'D',status:'development',description:'Implementación y correcciones'},
 {role:'Testing',initial:'T',status:'testing',description:'Validación y revisión'}
];
const actions:Record<Action,string>={assign:'Asignada a Develop',submit:'Enviada a Testing',fail:'Devuelta a Develop',pass:'Aprobada'};
const roles={orchestrator:'Orchestrator',develop:'Develop',testing:'Testing'};
export default function AgentOffice({tasks,project}:{tasks:Task[];project:string}){
 const events=tasks.flatMap(t=>t.events.map((event,index)=>({...event,title:t.title,key:t.id+'-'+index}))).sort((a,b)=>b.at.localeCompare(a.at)).slice(0,8);
 const completed=tasks.filter(t=>t.status==='done').length;
 return <section id="office" className="virtual-office" aria-labelledby="office-title">
 <div className="office-heading"><div><p className="eyebrow">PROJECT / SIMULATED WORKFLOW</p><h2 id="office-title">Oficina virtual de agentes</h2><p>Proyecto: <strong>{project}</strong></p></div><a href="#board">Gestionar tareas</a></div>
 <p>Las mesas representan colas de trabajo, no agentes de IA activos. La actividad se actualiza al realizar acciones en este proyecto.</p>
 <div className="office-floor">{desks.map(d=>{const queue=tasks.filter(t=>t.status===d.status);return <article key={d.role} className="office-desk" aria-label={'Mesa de '+d.role}><div className="desk-head"><span className={'avatar '+d.status} aria-hidden="true">{d.initial}</span><div><h3>{d.role}</h3><p>{d.description}</p></div></div><div className="desk-surface" aria-hidden="true"><span className="desk-monitor"><i/><i/><i/></span><span className="desk-keyboard"/><span className="desk-plant"/></div><div className="desk-count"><strong>{queue.length}</strong> {queue.length===1?'tarea en cola':'tareas en cola'}</div>{queue.length?<ul>{queue.slice(0,3).map(t=><li key={t.id}>{t.title}{t.cycles>0&&<small> · {t.cycles} correcciones</small>}</li>)}</ul>:<p>Sin tareas asignadas a esta fase.</p>}{queue.length>3&&<p>+{queue.length-3} en el tablero</p>}</article>})}</div>
 <div className="office-bottom"><article className="office-activity"><h3>Actividad del proyecto</h3>{events.length?<ol>{events.map(e=><li key={e.key}><strong>{roles[e.role]} · {actions[e.action]}</strong><p>{e.title}</p>{e.note&&<p className="office-note">{e.note}</p>}</li>)}</ol>:<p>Sin actividad registrada en este proyecto.</p>}</article><article className="office-summary"><h3>Control de calidad</h3><p>Tareas aprobadas</p><strong>{completed} / {tasks.length}</strong><progress aria-label="Progreso del proyecto" max={Math.max(tasks.length,1)} value={completed}/><p>Ciclos de corrección: <b>{tasks.reduce((n,t)=>n+t.cycles,0)}</b></p></article></div>
 </section>;
}
