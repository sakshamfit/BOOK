'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight,Eye,Square,Sprout,DoorOpen,TrainFront,Armchair,Map as MapIcon,Moon} from 'lucide-react';
import type {Book,Author} from '../lib/catalog';
import {conceptFor} from '../lib/worlds/concepts';

const ICONS:Record<string,typeof Eye>={noticing:Eye,silence:Square,wonder:Sprout,between:DoorOpen,train:TrainFront,everyday:Armchair,atlas:MapIcon,hours:Moon};
const TINTS=['#dfe8f1','#ebe3d6','#e5e3f0','#f1e0e4','#e0ebdf','#f3ead1','#e3edee','#efe2d6'];

// "Discover a book": pastel idea cards in a draggable, snapping carousel.
export default function DiscoverCards({books,authors,onOpen}:{books:Book[];authors:Author[];onOpen:(b:Book)=>void}){
 const track=useRef<HTMLDivElement>(null);const [active,setActive]=useState(0);const [pages,setPages]=useState(1);const drag=useRef<{x:number;left:number;moved:number}|null>(null);
 useEffect(()=>{const el=track.current;if(!el)return;const measure=()=>{const card=el.querySelector<HTMLElement>('.idea-card');const w=card?card.offsetWidth+parseFloat(getComputedStyle(el).columnGap||'0'):el.clientWidth;const per=Math.max(1,Math.round(el.clientWidth/w));setPages(Math.max(1,books.length-per+1));setActive(Math.round(el.scrollLeft/w));};measure();el.addEventListener('scroll',measure,{passive:true});const ro=new ResizeObserver(measure);ro.observe(el);return()=>{el.removeEventListener('scroll',measure);ro.disconnect();};},[books.length]);
 const go=(i:number)=>{const el=track.current;if(!el)return;const card=el.querySelector<HTMLElement>('.idea-card');const w=card?card.offsetWidth+parseFloat(getComputedStyle(el).columnGap||'0'):el.clientWidth;el.scrollTo({left:Math.max(0,Math.min(pages-1,i))*w,behavior:'smooth'});};
 const tilt=(e:React.PointerEvent<HTMLElement>)=>{if(e.pointerType==='touch')return;const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty('--rx',`${((e.clientY-r.top)/r.height-.5)*-9}deg`);e.currentTarget.style.setProperty('--ry',`${((e.clientX-r.left)/r.width-.5)*11}deg`);e.currentTarget.style.setProperty('--gx',`${(e.clientX-r.left)/r.width*100}%`);};
 const untilt=(e:React.PointerEvent<HTMLElement>)=>{e.currentTarget.style.setProperty('--rx','0deg');e.currentTarget.style.setProperty('--ry','0deg');};
 return <section className="discover section-pad" id="ideas" aria-labelledby="discover-title">
  <div className="discover-head" data-reveal>
   <div><span className="eyebrow accent-eyebrow">THE BIG IDEAS</span><h2 id="discover-title">Discover a <em>book.</em></h2></div>
   <p>Every title in the shop opens into a living, three-dimensional explanation. Pick an idea and watch it unfold.</p>
   <div className="discover-arrows"><button className="round-arrow" aria-label="Previous ideas" disabled={active<=0} onClick={()=>go(active-1)}><ArrowLeft size={18}/></button><button className="round-arrow" aria-label="Next ideas" disabled={active>=pages-1} onClick={()=>go(active+1)}><ArrowRight size={18}/></button></div>
  </div>
  <div className="idea-track" ref={track}
   onPointerDown={e=>{if(e.pointerType!=='mouse'||!track.current)return;drag.current={x:e.clientX,left:track.current.scrollLeft,moved:0};}}
   onPointerMove={e=>{const d=drag.current,el=track.current;if(!d||!el)return;const dx=e.clientX-d.x;d.moved=Math.max(d.moved,Math.abs(dx));if(d.moved>5){el.classList.add('dragging');el.scrollLeft=d.left-dx;}}}
   onPointerUp={()=>{const el=track.current;if(el){el.classList.remove('dragging');if(drag.current&&drag.current.moved>5){el.dataset.dragged='1';setTimeout(()=>{delete el.dataset.dragged;},0);}}drag.current=null;}}
   onPointerLeave={()=>{track.current?.classList.remove('dragging');drag.current=null;}}
   onClickCapture={e=>{if(track.current?.dataset.dragged){e.preventDefault();e.stopPropagation();}}}>
   {books.map((b,i)=>{const Icon=ICONS[b.id]||Eye;const c=conceptFor(b.id);const author=authors.find(a=>a.id===b.authorId);return <button key={b.id} className="idea-card" style={{'--tint':TINTS[i%TINTS.length],'--accent':c?.accent||'#e2483d'} as React.CSSProperties} onPointerMove={tilt} onPointerLeave={untilt} onClick={()=>onOpen(b)} aria-label={`Explore the idea in ${b.title}`}>
    <span className="idea-glare" aria-hidden="true"/>
    <span className="idea-icon"><Icon size={19} strokeWidth={1.8}/></span>
    <span className="idea-quote">{c?.subtitle||b.description}</span>
    <span className="idea-foot"><img src={b.cover} alt=""/><span><b>{b.title}</b><small>{author?.name}</small></span><span className="idea-go"><ArrowUpRight size={16}/></span></span>
   </button>;})}
  </div>
  <div className="idea-dots" role="tablist" aria-label="Idea pages">{Array.from({length:pages},(_,i)=><button key={i} role="tab" aria-selected={i===active} aria-label={`Show ideas page ${i+1}`} className={i===active?'active':''} onClick={()=>go(i)}/>)}</div>
 </section>;
}
