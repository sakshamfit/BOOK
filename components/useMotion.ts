'use client';
import {useEffect} from 'react';

// Scroll reveals for [data-reveal] elements. Re-scans when `key` changes (e.g. filtered results).
export function useReveal(key:unknown){
 useEffect(()=>{
  const els=[...document.querySelectorAll<HTMLElement>('[data-reveal]:not(.in)')];if(!els.length)return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){els.forEach(el=>el.classList.add('in'));return;}
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{rootMargin:'0px 0px -8% 0px',threshold:.08});
  els.forEach(el=>io.observe(el));return()=>io.disconnect();
 },[key]);
}

// Magnetic buttons (.magnetic) lean toward the pointer; tilt surfaces (.tilt) rotate in 3D under it.
export function usePointerMotion(enabled:boolean){
 useEffect(()=>{
  if(!enabled||matchMedia('(hover: none)').matches)return;
  let magnet:HTMLElement|null=null,tilt:HTMLElement|null=null,raf=0,ev:PointerEvent|null=null;
  const reset=(el:HTMLElement|null,props:string[])=>{if(el)props.forEach(p=>el.style.removeProperty(p));};
  const apply=()=>{raf=0;const e=ev;if(!e)return;const target=e.target instanceof Element?e.target:null;
   const m=target?.closest<HTMLElement>('.magnetic')??null;if(m!==magnet){reset(magnet,['--mx','--my']);magnet=m;}
   if(m){const r=m.getBoundingClientRect();m.style.setProperty('--mx',`${((e.clientX-r.left)/r.width-.5)*Math.min(14,r.width*.12)}px`);m.style.setProperty('--my',`${((e.clientY-r.top)/r.height-.5)*Math.min(10,r.height*.3)}px`);}
   const t=target?.closest<HTMLElement>('.tilt')??null;if(t!==tilt){reset(tilt,['--rx','--ry','--gx','--gy']);tilt=t;}
   if(t){const r=t.getBoundingClientRect();const x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;t.style.setProperty('--rx',`${(y-.5)*-8}deg`);t.style.setProperty('--ry',`${(x-.5)*10}deg`);t.style.setProperty('--gx',`${x*100}%`);t.style.setProperty('--gy',`${y*100}%`);}
  };
  const move=(e:PointerEvent)=>{if(e.pointerType==='touch')return;ev=e;if(!raf)raf=requestAnimationFrame(apply);};
  const out=()=>{reset(magnet,['--mx','--my']);reset(tilt,['--rx','--ry','--gx','--gy']);magnet=tilt=null;};
  document.addEventListener('pointermove',move,{passive:true});document.documentElement.addEventListener('pointerleave',out);
  return()=>{document.removeEventListener('pointermove',move);document.documentElement.removeEventListener('pointerleave',out);cancelAnimationFrame(raf);out();};
 },[enabled]);
}
