'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import type {Book} from '../lib/catalog';
import BookObject from './BookObject';

type Promo={title:[string,string];bg:string;button:string;book?:Book;action:()=>void};
// "Something will catch your eye": books standing on a white floating shelf against a
// best-seller wall, followed by three colour-blocked promotions.
export default function Showcase({books,onOpen,onBrowse}:{books:Book[];onOpen:(b:Book)=>void;onBrowse:(sort?:string,genre?:string)=>void}){
 const stage=useRef<HTMLDivElement>(null);const [landed,setLanded]=useState(false);
 useEffect(()=>{const el=stage.current;if(!el)return;const io=new IntersectionObserver(([e])=>{if(e.isIntersecting){setLanded(true);io.disconnect();}},{threshold:.35});io.observe(el);return()=>io.disconnect();},[]);
 const shelf=books.slice(0,7);
 const byId=(id:string)=>books.find(b=>b.id===id)||books[0];
 const promos:Promo[]=[
  {title:['New','Release'],bg:'#d9382f',button:'#a8211b',book:byId('between'),action:()=>onBrowse('curated','Fiction')},
  {title:['Top','Sellers'],bg:'#5fb89a',button:'#2b8565',book:byId('wonder'),action:()=>onBrowse('curated','Nature')},
  {title:['Top','Rated'],bg:'#1d3a78',button:'#2f6be0',book:byId('hours'),action:()=>onBrowse('high')},
 ];
 const parallax=(e:React.PointerEvent<HTMLDivElement>)=>{if(e.pointerType==='touch')return;const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty('--px',((e.clientX-r.left)/r.width-.5).toFixed(3));e.currentTarget.style.setProperty('--py',((e.clientY-r.top)/r.height-.5).toFixed(3));};
 const tilt=(e:React.PointerEvent<HTMLElement>)=>{if(e.pointerType==='touch')return;const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty('--rx',`${((e.clientY-r.top)/r.height-.5)*-10}deg`);e.currentTarget.style.setProperty('--ry',`${((e.clientX-r.left)/r.width-.5)*12}deg`);};
 const untilt=(e:React.PointerEvent<HTMLElement>)=>{e.currentTarget.style.setProperty('--rx','0deg');e.currentTarget.style.setProperty('--ry','0deg');};
 return <section className="showcase" id="bestsellers" aria-labelledby="showcase-title">
  <div className={`showcase-stage ${landed?'landed':''}`} ref={stage} onPointerMove={parallax} onPointerLeave={e=>{e.currentTarget.style.setProperty('--px','0');e.currentTarget.style.setProperty('--py','0');}}>
   <div className="showcase-watermark" aria-hidden="true">{Array.from({length:4},(_,i)=><span key={i}>BEST SELLERS BEST SELLERS</span>)}</div>
   <div className="shelf-scene">
    <div className="shelf-books">{shelf.map((b,i)=><div className="shelf-slot" key={b.id} style={{'--i':i} as React.CSSProperties}>
     <BookObject book={b} className="shelf-standing" onClick={()=>onOpen(b)}/>
     <span className="shelf-tag"><b>{b.title}</b><small>Open the world ↗</small></span>
    </div>)}</div>
    <div className="shelf-board" aria-hidden="true"><span className="shelf-top"/><span className="shelf-front"/></div>
    <div className="shelf-brackets" aria-hidden="true"><i/><i/><i/><i/></div>
   </div>
   <div className="showcase-copy">
    <span className="showcase-kicker">SOMETHING WILL CATCH YOUR EYE</span>
    <h2 id="showcase-title">Start your adventure journey<br/>by browsing whole worlds from our library</h2>
    <button className="button navy magnetic" onClick={()=>onBrowse()}>Explore <ArrowUpRight size={18}/></button>
   </div>
  </div>
  <div className="promo-grid">
   {promos.map((p,i)=><article className="promo" key={p.title.join(' ')} style={{'--promo':p.bg,'--promo-button':p.button,'--d':i} as React.CSSProperties} onPointerMove={tilt} onPointerLeave={untilt} data-reveal>
    <div className="promo-copy"><h3>{p.title[0]}<br/>{p.title[1]}</h3><button className="promo-button" onClick={p.action}>Shop Now <ArrowUpRight size={16}/></button></div>
    {p.book&&<div className="promo-book"><BookObject book={p.book} className="promo-object" onClick={()=>onOpen(p.book!)}/></div>}
    <span className="promo-shine" aria-hidden="true"/>
   </article>)}
  </div>
 </section>;
}
