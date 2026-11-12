'use client';
import {useEffect,useRef,useState} from 'react';
import type {Book} from '../../lib/catalog';
import type {Concept,WorldState} from '../../lib/worlds/concepts';
import type {Timeline} from '../../lib/worlds/engine';
import WorldFallback from './WorldFallback';
export type WorldApi={live:()=>{amount:number;progress:number;step:number;phase:Timeline['phase']};recenter:()=>void};
export type WorldStatus='loading'|'ready'|'fallback';
type Props={book:Book;concept:Concept;state:WorldState;onChange:(next:Partial<WorldState>)=>void;onTick?:(t:Timeline)=>void;onStepEnd?:(step:number)=>void;onStatus?:(s:WorldStatus)=>void;apiRef?:React.MutableRefObject<WorldApi|null>};
export default function WorldCanvas(props:Props){
 const {book,concept,state}=props;
 const host=useRef<HTMLDivElement>(null);const engine=useRef<ReturnType<typeof import('../../lib/worlds/engine').createWorld>|null>(null);
 const latest=useRef(props);const current=useRef(state);
 useEffect(()=>{latest.current=props;current.current=state;});
 const [status,setStatus]=useState<WorldStatus>('loading');
 useEffect(()=>{latest.current.onStatus?.(status);},[status]);
 useEffect(()=>{let live=true;import('../../lib/worlds/engine').then(({createWorld})=>{if(!live||!host.current)return;try{
  const world=createWorld(host.current,book,concept,{
   onPick:pick=>{const on=latest.current.onChange;if(pick==='open')on({open:true});else if(typeof pick==='number')on({choice:pick,playing:false});},
   onTick:t=>latest.current.onTick?.(t),onStepEnd:s=>latest.current.onStepEnd?.(s),onAmount:a=>latest.current.onChange({amount:a,playing:false})});
  engine.current=world;world.setState(current.current);if(latest.current.apiRef)latest.current.apiRef.current=world;setStatus('ready');
 }catch(error){console.warn('The 3D scene is unavailable; using the accessible illustrated experience.',error);host.current?.replaceChildren();setStatus('fallback');}}).catch(()=>{if(live)setStatus('fallback');});
 return()=>{live=false;engine.current?.dispose();engine.current=null;if(latest.current.apiRef)latest.current.apiRef.current=null;};},[book.id,book.cover,book.title,concept]);
 useEffect(()=>{engine.current?.setState(state);},[state]);
 return <div className={`xp-stage is-${status}`}>
  <div className="xp-canvas" ref={host}/>
  {status==='fallback'&&<WorldFallback concept={concept} state={state}/>}
  <div className="xp-vignette" aria-hidden="true"/>
  {status==='loading'&&<div className="xp-loading" role="status"><span className="xp-loading-book" aria-hidden="true"><i/><i/><i/></span><span>Preparing a little world…</span></div>}
 </div>;
}
