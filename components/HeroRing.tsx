'use client';
import {useEffect,useRef} from 'react';
import type {Book} from '../lib/catalog';
import BookObject from './BookObject';

// A carousel of books standing on a turning ring. The front of the ring travels right to left;
// drag to spin it (it coasts and settles back to its own pace), hover to slow it, click to open.
export default function HeroRing({books,paused,onOpen}:{books:Book[];paused:boolean;onOpen:(b:Book)=>void}){
 const stage=useRef<HTMLDivElement>(null),ring=useRef<HTMLDivElement>(null),items=useRef<(HTMLDivElement|null)[]>([]);
 const live=useRef({paused,hover:false});
 useEffect(()=>{live.current.paused=paused;},[paused]);
 const list=books.length?Array.from({length:Math.max(12,books.length*2)},(_,i)=>books[i%books.length]):[];
 const count=list.length,step=360/(count||1);
 useEffect(()=>{
  const el=stage.current,r=ring.current;if(!el||!r||!count)return;
  let angle=0,velocity=0,raf=0,last=performance.now(),drag:{x:number;angle:number;t:number;moved:number}|null=null;
  const BASE=-16.5;// degrees per second, negative = front moves right to left
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const radius=()=>Math.max(el.clientWidth<700?210:300,Math.min(520,el.clientWidth*.34));
  const frame=(t:number)=>{
   const dt=Math.min(.05,(t-last)/1000);last=t;
   if(!drag){const target=live.current.paused||reduce?0:BASE*(live.current.hover?.22:1);velocity+=(target-velocity)*(1-Math.exp(-dt*2.2));angle+=velocity*dt;}
   const R=radius();r.style.transform=`translateZ(${-R}px) rotateX(-7deg) rotateY(${angle}deg)`;
   items.current.forEach((it,i)=>{if(!it)return;const a=((i*step+angle)%360+360)%360;const facing=Math.cos(a*Math.PI/180);it.style.transform=`rotateY(${i*step}deg) translateZ(${R}px)`;it.style.setProperty('--f',((facing+1)/2).toFixed(3));it.classList.toggle('is-front',facing>.93);it.inert=facing<.15;});
   raf=requestAnimationFrame(frame);
  };
  raf=requestAnimationFrame(frame);
  const down=(e:PointerEvent)=>{if(e.button!==0)return;drag={x:e.clientX,angle,t:performance.now(),moved:0};velocity=0;};
  const move=(e:PointerEvent)=>{if(!drag)return;const dx=e.clientX-drag.x;drag.moved=Math.max(drag.moved,Math.abs(dx));if(drag.moved>4&&!el.hasPointerCapture(e.pointerId))el.setPointerCapture(e.pointerId);const now=performance.now(),next=drag.angle+dx*.22;velocity=(next-angle)/Math.max(.008,(now-drag.t)/1000)*.5;angle=next;drag.t=now;drag.angle=angle;drag.x=e.clientX;};
  const up=(e:PointerEvent)=>{if(!drag)return;const moved=drag.moved;drag=null;velocity=Math.max(-260,Math.min(260,velocity));if(moved>4){e.preventDefault();el.dataset.dragged='1';setTimeout(()=>{delete el.dataset.dragged;},0);}};
  const wheel=(e:WheelEvent)=>{if(Math.abs(e.deltaX)>Math.abs(e.deltaY)){velocity-=e.deltaX*.6;}};
  el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('wheel',wheel,{passive:true});
  return()=>{cancelAnimationFrame(raf);el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);el.removeEventListener('wheel',wheel);};
 },[count,step]);
 return <div className="hero-ring" ref={stage} aria-label="A turning carousel of books. Drag to spin it." onPointerEnter={()=>live.current.hover=true} onPointerLeave={()=>live.current.hover=false} onClickCapture={e=>{if(stage.current?.dataset.dragged){e.preventDefault();e.stopPropagation();}}}>
  <div className="hero-ring-floor" aria-hidden="true"/>
  <div className="hero-ring-track" ref={ring}>
   {list.map((b,i)=><div className="ring-item" key={`${b.id}-${i}`} ref={el=>{items.current[i]=el;}}>
    <BookObject book={b} className="ring-book" onClick={()=>onOpen(b)}/>
    <span className="ring-label">{b.title} <b>↗</b></span>
   </div>)}
  </div>
 </div>;
}
