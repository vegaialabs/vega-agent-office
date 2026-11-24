'use client';
import {useEffect,useRef,useState} from 'react';
type Turnstile={render:(el:HTMLElement,options:Record<string,unknown>)=>string;remove:(id:string)=>void};
declare global {interface Window {turnstile?:Turnstile}}
export default function Captcha({onToken}:{onToken:(token:string)=>void}){
 const container=useRef<HTMLDivElement>(null);const [failed,setFailed]=useState(false);
 const sitekey=process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
 useEffect(()=>{if(!sitekey)return;let widget:string|undefined;let cancelled=false;
 const render=()=>{if(!cancelled&&container.current&&window.turnstile&&widget===undefined)widget=window.turnstile.render(container.current,{sitekey,callback:onToken,'expired-callback':()=>onToken(''),'error-callback':()=>{onToken('');setFailed(true);}});};
 let script=document.querySelector<HTMLScriptElement>('script[data-turnstile]');
 if(!script){script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.dataset.turnstile='true';document.head.append(script);}
 const error=()=>setFailed(true);script.addEventListener('load',render);script.addEventListener('error',error);render();
 return()=>{cancelled=true;script?.removeEventListener('load',render);script?.removeEventListener('error',error);if(widget!==undefined)window.turnstile?.remove(widget);};
 },[sitekey,onToken]);
 if(!sitekey)return <p role="status">Inicio anónimo bloqueado: falta configurar CAPTCHA.</p>;
 return <><div ref={container} aria-label="Verificación CAPTCHA"/>{failed&&<p role="alert">No se pudo verificar CAPTCHA. Recarga la página para reintentar.</p>}</>;
}
