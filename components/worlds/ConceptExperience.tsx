'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {ArrowUpRight,BookOpen,Check,ChevronLeft,ChevronRight,List,LocateFixed,Pause,Play,RotateCcw,ShoppingBag,SlidersHorizontal,Sparkles,UserRound,X,ZoomIn,ZoomOut} from 'lucide-react';
import type {Book,Author} from '../../lib/catalog';
import {euro} from '../../lib/catalog';
import {conceptFor,initialWorldState,WorldState} from '../../lib/worlds/concepts';
import type {Timeline} from '../../lib/worlds/engine';
import WorldCanvas,{WorldApi,WorldStatus} from './WorldCanvas';

// A guided, self-playing pop-up explanation: the book opens itself, the model rises,
// and each step plays like a short film with captions. Readers can pause and take over.
export default function ConceptExperience({book,author,onRead,onAuthor,onAdd,standalone=false}:{book:Book;author:Author;onRead?:()=>void;onAuthor?:()=>void;onAdd?:()=>void;standalone?:boolean}){
 const concept=conceptFor(book.id)!;
 const [state,setState]=useState<WorldState>(()=>({...initialWorldState(concept),playing:true}));
 const [status,setStatus]=useState<WorldStatus>('loading');const [phase,setPhase]=useState<Timeline['phase']>('closed');const [beat,setBeat]=useState(0);const [ended,setEnded]=useState(false);
 const [tools,setTools]=useState(false);const [chapters,setChapters]=useState(false);const [lesson,setLesson]=useState(true);const [added,setAdded]=useState(false);
 const api=useRef<WorldApi|null>(null);const fills=useRef<(HTMLSpanElement|null)[]>([]);const phaseRef=useRef(phase);const beatRef=useRef(0);
 const update=useCallback((next:Partial<WorldState>)=>{setState(s=>({...s,...next}));if(next.playing===false)setEnded(false);},[]);
 const step=concept.steps[state.step];
 // The book opens on its own once the scene is ready.
 useEffect(()=>{if(status==='loading'||state.open)return;const t=setTimeout(()=>{
  // Small screens start with the explanation tucked away; reduced motion never auto-plays.
  if(matchMedia('(max-width: 760px)').matches)setLesson(false);
  const still=status==='fallback'||matchMedia('(prefers-reduced-motion: reduce)').matches;setState(s=>({...s,open:true,playing:s.playing&&!still}));
 },status==='ready'?420:0);return()=>clearTimeout(t);},[status,state.open]);
 const onTick=useCallback((t:Timeline)=>{
  fills.current.forEach((el,i)=>{if(el)el.style.transform=`scaleX(${i<t.step?1:i===t.step?t.progress:0})`;});
  if(t.phase!==phaseRef.current){phaseRef.current=t.phase;setPhase(t.phase);}
  const b=t.progress<.34?0:t.progress<.67?1:2;if(b!==beatRef.current){beatRef.current=b;setBeat(b);}
 },[]);
 const onStepEnd=useCallback((done:number)=>{if(done<concept.steps.length-1){const n=concept.steps[done+1];setState(s=>({...s,step:done+1,choice:n.choice,amount:concept.steps[done].amount,progress:0}));}else{setState(s=>({...s,playing:false,amount:concept.steps[done].amount}));setEnded(true);}},[concept]);
 const goto=(i:number)=>{const n=concept.steps[i];setEnded(false);setChapters(false);beatRef.current=0;setBeat(0);setState(s=>({...s,step:i,choice:n.choice,amount:i===0?concept.range.start:concept.steps[i-1].amount,progress:0,playing:true,open:true,reset:s.step===i?s.reset+1:s.reset}));};
 const toggle=()=>{if(ended){goto(0);return;}if(state.playing){const live=api.current?.live();setState(s=>({...s,playing:false,amount:live?Math.round(live.amount):s.amount}));}else setState(s=>({...s,playing:true,open:true}));};
 const story=phase==='story'||status==='fallback';
 const onKey=(e:React.KeyboardEvent)=>{if((e.target as HTMLElement).matches('input,select,textarea'))return;if(e.key===' '&&story){e.preventDefault();toggle();}if(e.key==='ArrowRight'&&state.step<2){e.preventDefault();goto(state.step+1);}if(e.key==='ArrowLeft'&&state.step>0){e.preventDefault();goto(state.step-1);}};
 return <section className={`xp ${standalone?'xp-standalone':''} ${story?'is-story':''} ${tools?'tools-open':''}`} style={{'--world-accent':concept.accent,'--world-bg':concept.background} as React.CSSProperties} aria-labelledby="world-book-title" onKeyDown={onKey}>
  <WorldCanvas book={book} concept={concept} state={state} onChange={update} onTick={onTick} onStepEnd={onStepEnd} onStatus={setStatus} apiRef={api}/>
  <header className="xp-head">
   <span className="xp-kicker"><Sparkles size={12}/>{concept.kicker}</span>
   <h2 id="world-book-title">{concept.title}</h2>
   <div className="xp-credit"><img src={book.cover} alt=""/><div><strong>{book.title}</strong><span>by {author.name}</span>{!standalone&&<a href={`/world/${book.id}`}>Open full screen <ArrowUpRight size={12}/></a>}</div></div>
  </header>
  {lesson?<aside className="xp-lesson" aria-live="polite" key={state.step}>
   <div className="xp-lesson-top"><span>THE IDEA · {state.step+1} OF 3</span><button className="xp-icon" aria-label="Hide the explanation" onClick={()=>setLesson(false)}><X size={14}/></button></div>
   <h3>{step.title}</h3><p>{step.text}</p>
   <div className="xp-try"><span>TRY THIS</span><p>{step.prompt}</p></div>
  </aside>:<button className="xp-lesson-show" onClick={()=>setLesson(true)}><BookOpen size={15}/> Show the idea</button>}
  <div className="xp-dock">
   <div className="xp-pill" role="group" aria-label="Story controls">
    <div className="xp-chapters-wrap">
     <button className="xp-icon" aria-label="Chapters" aria-expanded={chapters} onClick={()=>setChapters(!chapters)}><List size={17}/></button>
     {chapters&&<div className="xp-chapters" role="menu">{concept.steps.map((s,i)=><button role="menuitem" key={s.title} className={i===state.step?'active':''} onClick={()=>goto(i)}><span>{String(i+1).padStart(2,'0')}</span>{s.title}</button>)}</div>}
    </div>
    <button className="xp-icon" aria-label="Previous step" disabled={state.step===0} onClick={()=>goto(state.step-1)}><ChevronLeft size={18}/></button>
    <button className="xp-play" aria-label={ended?'Replay':state.playing?'Pause':'Play'} onClick={toggle} disabled={!story}>{ended?<RotateCcw size={16}/>:state.playing?<Pause size={16}/>:<Play size={16}/>}</button>
    <div className="xp-caption" aria-live="polite"><b>{state.step+1}</b><span key={`${state.step}-${beat}`}>{phase==='story'||status==='fallback'?step.beats[beat]:phase==='opening'?'Opening the book…':'A little world is taking shape…'}</span></div>
    <div className="xp-progress" aria-hidden="true">{concept.steps.map((s,i)=><button key={s.title} tabIndex={-1} onClick={()=>goto(i)} aria-label={`Go to step ${i+1}`}><span ref={el=>{fills.current[i]=el;}} style={{transform:`scaleX(${i<state.step?1:0})`}}/></button>)}</div>
    <button className="xp-icon" aria-label="Next step" disabled={state.step===2} onClick={()=>goto(state.step+1)}><ChevronRight size={18}/></button>
    <span className="xp-sep"/>
    <button className="xp-icon" aria-label={state.closeUp?'Show the whole book':'Look closer'} aria-pressed={state.closeUp} onClick={()=>update({closeUp:!state.closeUp})}>{state.closeUp?<ZoomOut size={16}/>:<ZoomIn size={16}/>}</button>
    <button className="xp-icon" aria-label="Recentre the camera" onClick={()=>api.current?.recenter()}><LocateFixed size={16}/></button>
    <button className={`xp-icon ${tools?'on':''}`} aria-label="Make it yours" aria-expanded={tools} onClick={()=>setTools(!tools)}><SlidersHorizontal size={16}/></button>
   </div>
   <p className="xp-hint">Drag to look around · scroll to zoom · tap a coloured object</p>
  </div>
  <aside className="xp-tools" aria-label="Make the idea yours" aria-hidden={!tools}>
   <div className="xp-tools-top"><span>MAKE THE IDEA YOURS</span><button className="xp-icon" aria-label="Close controls" onClick={()=>setTools(false)} tabIndex={tools?0:-1}><X size={15}/></button></div>
   <fieldset disabled={!tools||!state.open}>
    <label className="xp-range"><span>{concept.range.label}<output>{Math.round(state.amount)}{concept.range.unit}</output></span><input type="range" min={concept.range.min} max={concept.range.max} value={state.amount} onChange={e=>update({amount:+e.target.value,playing:false})}/></label>
    <div className="xp-choices">{concept.choices.map((label,i)=><button key={label} className={state.choice===i?'active':''} aria-pressed={state.choice===i} onClick={()=>update({choice:i,playing:false})}><i style={{background:concept.colors[i]}}/>{label}{state.choice===i&&<Check size={13}/>}</button>)}</div>
    <label className="xp-toggle"><input type="checkbox" checked={state.alternate} onChange={e=>update({alternate:e.target.checked})}/><span className="xp-switch" aria-hidden="true"/><span>{concept.toggle}</span></label>
    <p className="xp-detail">{concept.details[state.choice]}</p>
   </fieldset>
   <div className="xp-tools-actions">{onRead&&<button onClick={onRead} tabIndex={tools?0:-1}><BookOpen size={15}/>Read the sample</button>}{onAuthor&&<button onClick={onAuthor} tabIndex={tools?0:-1}><UserRound size={15}/>Meet the author</button>}</div>
  </aside>
  {onAdd&&<button className="xp-buy" disabled={!book.stock} onClick={()=>{onAdd();setAdded(true);}}>{added?<Check size={16}/>:<ShoppingBag size={16}/>}<span>{added?'Added to bag':'Add to bag'}</span><b>{euro(book.price)}</b></button>}
 </section>;
}
