'use client';
import {useEffect,useRef,useState} from 'react';
import {RotateCcw,Shuffle} from 'lucide-react';
import type {Book} from '../lib/catalog';
type Body={x:number;y:number;vx:number;vy:number;a:number;va:number;w:number;h:number;inv:number;invI:number;img:HTMLImageElement;book:Book;delay:number};

// A pile of books with rigid-body physics: they fall when the footer comes into view, and can be
// grabbed and thrown, flicked with a quick sweep, popped with a tap, or opened with a double-click.
export default function FallingBooks({books,paused,onOpen}:{books:Book[];paused:boolean;onOpen?:(b:Book)=>void}){
 const canvas=useRef<HTMLCanvasElement>(null);const [replay,setReplay]=useState(0);const [started,setStarted]=useState(false);const [tip,setTip]=useState<{x:number;y:number;title:string}|null>(null);
 const active=useRef(true),visible=useRef(false),shake=useRef(0),open=useRef(onOpen);
 useEffect(()=>{open.current=onOpen;},[onOpen]);
 useEffect(()=>{active.current=!paused;},[paused]);
 useEffect(()=>{const c=canvas.current;if(!c)return;const io=new IntersectionObserver(([e])=>{visible.current=e.isIntersecting;if(e.isIntersecting)setStarted(true);},{threshold:.15});io.observe(c);return()=>io.disconnect();},[]);
 useEffect(()=>{
  if(!started)return;const c=canvas.current!;const ctx=c.getContext('2d');if(!ctx)return;
  let raf=0,alive=true,last=performance.now(),acc=0,frame=0,quiet=0,bodies:Body[]=[],hover:Body|null=null;
  let drag:{b:Body;ox:number;oy:number;px:number;py:number;vx:number;vy:number;t:number;moved:number;downAt:number}|null=null;let lastTap={t:0,b:null as Body|null,x:0,y:0};
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rect=c.getBoundingClientRect(),W=rect.width,H=rect.height,dpr=Math.min(devicePixelRatio,2);c.width=W*dpr;c.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
  const images=books.map(b=>{const im=new Image();im.src=b.cover;return im;});
  const make=()=>{const count=W<600?14:W<1000?20:27;bodies=Array.from({length:count},(_,i)=>{const w=(W<600?52:70)+(i%4)*(W<600?7:10),h=w*1.48,m=w*h/9000;const bi=i%books.length;return {x:w/2+((i*137.5)%Math.max(1,W-w)),y:reduce?H-h/2-Math.floor(i/Math.max(1,Math.floor(W/(w+8))))*h*.6:-h-(i%4)*130-Math.floor(i/4)*40,vx:Math.sin(i*4)*2.2,vy:0,a:Math.sin(i*11)*.7,va:Math.sin(i*3)*.03,w,h,inv:1/m,invI:12/(m*(w*w+h*h)),img:images[bi],book:books[bi],delay:reduce?0:i*4};});frame=0;quiet=0;};
  const corners=(b:Body)=>{const cs=Math.cos(b.a),sn=Math.sin(b.a),hw=b.w/2,hh=b.h/2;return [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].map(([x,y])=>({x:b.x+x*cs-y*sn,y:b.y+x*sn+y*cs}));};
  const extent=(b:Body)=>({x:Math.abs(Math.cos(b.a))*b.w/2+Math.abs(Math.sin(b.a))*b.h/2,y:Math.abs(Math.sin(b.a))*b.w/2+Math.abs(Math.cos(b.a))*b.h/2});
  const impulse=(b:Body,jx:number,jy:number,rx:number,ry:number)=>{if(drag?.b===b)return;b.vx+=jx*b.inv;b.vy+=jy*b.inv;b.va+=(rx*jy-ry*jx)*b.invI;};
  function collide(a:Body,b:Body){
   const axes=[{x:Math.cos(a.a),y:Math.sin(a.a)},{x:-Math.sin(a.a),y:Math.cos(a.a)},{x:Math.cos(b.a),y:Math.sin(b.a)},{x:-Math.sin(b.a),y:Math.cos(b.a)}];let overlap=Infinity,n=axes[0];
   for(const ax of axes){const r=(q:Body)=>Math.abs(ax.x*Math.cos(q.a)+ax.y*Math.sin(q.a))*q.w/2+Math.abs(-ax.x*Math.sin(q.a)+ax.y*Math.cos(q.a))*q.h/2;const d=(b.x-a.x)*ax.x+(b.y-a.y)*ax.y;const o=r(a)+r(b)-Math.abs(d);if(o<=0)return;if(o<overlap){overlap=o;n={x:ax.x*Math.sign(d||1),y:ax.y*Math.sign(d||1)};}}
   // Contact point: the deepest corner of either box inside the other, approximated by the mid point of the closest corners.
   const ca=corners(a),cb=corners(b);let best=ca[0],bd=-Infinity;for(const p of ca){const d=(p.x-b.x)*-n.x+(p.y-b.y)*-n.y;if(d>bd){bd=d;best=p;}}for(const p of cb){const d=(p.x-a.x)*n.x+(p.y-a.y)*n.y;if(d>bd){bd=d;best=p;}}
   const ia=drag?.b===a?0:a.inv,ib=drag?.b===b?0:b.inv,sum=ia+ib;if(!sum)return;
   a.x-=n.x*overlap*ia/sum;a.y-=n.y*overlap*ia/sum;b.x+=n.x*overlap*ib/sum;b.y+=n.y*overlap*ib/sum;
   const rax=best.x-a.x,ray=best.y-a.y,rbx=best.x-b.x,rby=best.y-b.y;
   const va={x:a.vx-a.va*ray,y:a.vy+a.va*rax},vb={x:b.vx-b.va*rby,y:b.vy+b.va*rbx};const rel=(vb.x-va.x)*n.x+(vb.y-va.y)*n.y;if(rel>0)return;
   const ran=rax*n.y-ray*n.x,rbn=rbx*n.y-rby*n.x;const k=sum+(drag?.b===a?0:ran*ran*a.invI)+(drag?.b===b?0:rbn*rbn*b.invI);const j=-(1.25)*rel/k;
   impulse(a,-n.x*j,-n.y*j,rax,ray);impulse(b,n.x*j,n.y*j,rbx,rby);
   const tx=-n.y,ty=n.x,relT=(vb.x-va.x)*tx+(vb.y-va.y)*ty;const jt=Math.max(-j*.45,Math.min(j*.45,-relT/k));impulse(a,-tx*jt,-ty*jt,rax,ray);impulse(b,tx*jt,ty*jt,rbx,rby);
  }
  function step(){
   frame++;let energy=0;
   for(const b of bodies){if(frame<b.delay||b===drag?.b)continue;b.vy+=.42;b.x+=b.vx;b.y+=b.vy;b.a+=b.va;b.vx*=.996;b.vy*=.998;b.va*=.985;
    const e=extent(b);
    if(b.y+e.y>H){b.y=H-e.y;const low=corners(b).reduce((m,p)=>p.y>m.y?p:m);const rx=low.x-b.x;if(b.vy>0)b.vy=-b.vy*.22;b.vx*=.86;b.va+=rx*.00018*Math.abs(b.vy+1);
     const flat=Math.round(b.a/(Math.PI/2))*(Math.PI/2);b.va+=(flat-b.a)*.012;b.va*=.86;}
    if(b.x-e.x<0){b.x=e.x;b.vx=Math.abs(b.vx)*.5;b.va*=.8;}if(b.x+e.x>W){b.x=W-e.x;b.vx=-Math.abs(b.vx)*.5;b.va*=.8;}if(b.y-e.y<-H*2)b.y=-H*2+e.y;
    energy+=b.vx*b.vx+b.vy*b.vy+b.va*b.va*400;}
   for(let it=0;it<3;it++)for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){if(frame>=bodies[i].delay&&frame>=bodies[j].delay)collide(bodies[i],bodies[j]);}
   quiet=energy<bodies.length*.06&&frame>bodies.length*4+60?quiet+1:0;
  }
  function draw(){
   ctx!.clearRect(0,0,W,H);
   for(const b of bodies){if(frame<b.delay&&!reduce)continue;const lift=b===hover||b===drag?.b;ctx!.save();ctx!.translate(b.x,b.y);ctx!.rotate(b.a);if(lift)ctx!.scale(1.05,1.05);
    ctx!.shadowColor='rgba(0,0,0,.45)';ctx!.shadowBlur=lift?26:12;ctx!.shadowOffsetY=lift?12:5;ctx!.fillStyle='#ece6d8';ctx!.fillRect(-b.w/2+4,-b.h/2+3,b.w,b.h);ctx!.shadowColor='transparent';
    if(b.img.complete&&b.img.naturalWidth)ctx!.drawImage(b.img,-b.w/2,-b.h/2,b.w,b.h);else{ctx!.fillStyle=b.book.color;ctx!.fillRect(-b.w/2,-b.h/2,b.w,b.h);}
    ctx!.fillStyle='rgba(0,0,0,.16)';ctx!.fillRect(-b.w/2,-b.h/2,4,b.h);ctx!.fillStyle='rgba(255,255,255,.12)';ctx!.fillRect(-b.w/2+5,-b.h/2,2,b.h);
    if(lift){ctx!.strokeStyle='#f5f3ed';ctx!.lineWidth=2;ctx!.strokeRect(-b.w/2-4,-b.h/2-4,b.w+8,b.h+8);}
    ctx!.restore();}
  }
  const tick=(t:number)=>{if(!alive)return;raf=requestAnimationFrame(tick);if(!visible.current||!active.current){last=t;return;}
   const dt=Math.min(.1,(t-last)/1000);last=t;
   if(shake.current){shake.current=0;quiet=0;for(const b of bodies){b.vy-=8+Math.random()*9;b.vx+=(Math.random()-.5)*14;b.va+=(Math.random()-.5)*.25;}}
   if(quiet<60||drag){acc+=dt;let n=0;while(acc>1/60&&n<4){step();acc-=1/60;n++;}draw();}
  };
  const point=(e:PointerEvent)=>{const r=c.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
  const at=(p:{x:number;y:number})=>{for(let i=bodies.length-1;i>=0;i--){const b=bodies[i];if(frame<b.delay&&!reduce)continue;const dx=p.x-b.x,dy=p.y-b.y,cs=Math.cos(-b.a),sn=Math.sin(-b.a),lx=dx*cs-dy*sn,ly=dx*sn+dy*cs;if(Math.abs(lx)<b.w/2&&Math.abs(ly)<b.h/2)return b;}return null;};
  const down=(e:PointerEvent)=>{const p=point(e);
   // A second tap near the first opens that book, even though the first tap bounced it away.
   if(lastTap.b&&performance.now()-lastTap.t<400&&Math.hypot(p.x-lastTap.x,p.y-lastTap.y)<36){open.current?.(lastTap.b.book);lastTap={t:0,b:null,x:0,y:0};return;}
   const b=at(p);if(!b)return;c.setPointerCapture(e.pointerId);bodies.splice(bodies.indexOf(b),1);bodies.push(b);drag={b,ox:p.x-b.x,oy:p.y-b.y,px:p.x,py:p.y,vx:0,vy:0,t:performance.now(),moved:0,downAt:performance.now()};b.vx=b.vy=0;quiet=0;setTip(null);};
  const move=(e:PointerEvent)=>{const p=point(e);
   if(drag){const now=performance.now(),dt=Math.max(8,now-drag.t);const vx=(p.x-drag.px)/dt*16,vy=(p.y-drag.py)/dt*16;drag.vx=drag.vx*.6+vx*.4;drag.vy=drag.vy*.6+vy*.4;drag.moved+=Math.hypot(p.x-drag.px,p.y-drag.py);
    const b=drag.b;b.va+=(drag.ox*vy-drag.oy*vx)*.00002*60;b.va*=.9;b.a+=b.va;const cs=Math.cos(b.va),sn=Math.sin(b.va);const ox=drag.ox*cs-drag.oy*sn,oy=drag.ox*sn+drag.oy*cs;drag.ox=ox;drag.oy=oy;b.x=p.x-ox;b.y=p.y-oy;drag.px=p.x;drag.py=p.y;drag.t=now;quiet=0;return;}
   const b=at(p);if(b!==hover){hover=b;c.style.cursor=b?'grab':'default';quiet=Math.min(quiet,40);}
   setTip(b?{x:p.x,y:p.y,title:b.book.title}:null);
   // A quick sweep flicks the books it passes over.
   const speed=Math.hypot(e.movementX,e.movementY);if(b&&speed>14){b.vx+=e.movementX*.35;b.vy+=e.movementY*.25-2;b.va+=e.movementX*.002;quiet=0;}
  };
  const up=()=>{if(!drag)return;const {b,vx,vy,moved,downAt}=drag;const drag0={x:drag.px,y:drag.py};drag=null;
   if(moved<6&&performance.now()-downAt<300){b.vy=-11-Math.random()*4;b.va=(Math.random()-.5)*.3;lastTap={t:performance.now(),b,x:drag0.x,y:drag0.y};}
   else{b.vx=Math.max(-40,Math.min(40,vx));b.vy=Math.max(-40,Math.min(40,vy));}quiet=0;};
  const leave=()=>{hover=null;setTip(null);};
  c.addEventListener('pointerdown',down);c.addEventListener('pointermove',move);c.addEventListener('pointerup',up);c.addEventListener('pointercancel',up);c.addEventListener('pointerleave',leave);
  Promise.all(images.map(im=>im.decode().catch(()=>{}))).then(()=>{if(!alive)return;make();if(reduce){for(let i=0;i<500;i++)step();}draw();raf=requestAnimationFrame(t=>{last=t;tick(t);});});
  return()=>{alive=false;cancelAnimationFrame(raf);c.removeEventListener('pointerdown',down);c.removeEventListener('pointermove',move);c.removeEventListener('pointerup',up);c.removeEventListener('pointercancel',up);c.removeEventListener('pointerleave',leave);};
 },[books,replay,started]);
 return <div className="falling-books">
  <div className="pile-controls"><button className="pill-button" onClick={()=>setReplay(v=>v+1)}><RotateCcw size={14}/> Let them fall again</button><button className="pill-button" onClick={()=>{shake.current=1;}}><Shuffle size={14}/> Shake the pile</button></div>
  <span className="pile-hint">GRAB · THROW · FLICK · TAP TO BOUNCE · DOUBLE-CLICK TO OPEN</span>
  <canvas ref={canvas} aria-label="An interactive pile of book covers. Drag books to throw them; double-click a book to open it." role="img"/>
  {tip&&<span className="pile-tip" style={{left:tip.x,top:tip.y}}>{tip.title}</span>}
 </div>;
}
