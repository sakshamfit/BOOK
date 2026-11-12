import * as T from 'three';
import type {Concept} from '../concepts';
import {PAPER,box,cyl,sphere,lathe,extrude,group,tube,card,jarRack,ribbon,waves,dashed,glow,mannequin,archShape,shot,shotPath,ease,easeOut,segment,mix,clamp01,type Model,type V3} from '../kit';

// The World in Between: a paper street façade with three arched doors. A traveller walks up,
// one door swings open onto its own small world, and a path draws itself through it. The routes
// not taken stay on the street as dotted lines.
const DOOR_X=[-1.85,0,1.85],FACADE_Z=-1.2,START:V3=[0,0,1.85];
function frameShape(w:number,h:number,iw:number,ih:number){const r=w/2,ir=iw/2;const s=new T.Shape();s.moveTo(-r,0);s.lineTo(-r,h-r);s.absarc(0,h-r,r,Math.PI,0,true);s.lineTo(r,0);s.lineTo(ir,0);s.lineTo(ir,ih-ir);s.absarc(0,ih-ir,ir,0,Math.PI,false);s.lineTo(-ir,0);s.lineTo(-r,0);return s;}
function gable(w:number,h:number){const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(0,h);s.lineTo(-w/2,0);return s;}

export function buildBetween(p:T.Group,c:Concept):Model{
 box(p,5.9,.05,4.9,'#f3efe6',0,.025,-.55);
 // Cobbles and a kerb along the street.
 for(let i=0;i<9;i++)box(p,.5,.02,.32,'#ebe5d8',-2.2+i*.55,.06,.55+(i%2)*.06,{strength:.6});
 box(p,5.9,.08,.12,PAPER,0,.07,-.95);
 // The façade with three arched openings.
 const facade=new T.Shape();facade.moveTo(-2.95,0);facade.lineTo(2.95,0);facade.lineTo(2.95,2.75);facade.lineTo(2.55,2.75);facade.lineTo(2.55,2.95);facade.lineTo(-2.55,2.95);facade.lineTo(-2.55,2.75);facade.lineTo(-2.95,2.75);facade.lineTo(-2.95,0);
 for(const x of DOOR_X){const a=archShape(1.0,2.3);facade.holes.push(new T.Path(a.getPoints(28).map(v=>new T.Vector2(v.x+x,v.y+.32))));}
 extrude(group(p,0,0,FACADE_Z),facade,.16,'#f2ede2');
 for(let i=0;i<4;i++)box(p,.16,2.75,.24,PAPER,-2.8+i*1.87,1.38,FACADE_Z+.05);box(p,5.9,.1,.3,PAPER,0,2.72,FACADE_Z+.04);
 const doors:T.Group[]=[],worlds:T.Group[]=[],units:T.Group[]=[];
 DOOR_X.forEach((x,i)=>{
  const unit=group(p,x,0,FACADE_Z,i);units.push(unit);
  [[1.3,.1,.72],[1.15,.1,.54],[1.0,.1,.36]].forEach(([w,h,d],k)=>box(unit,w,h,d,PAPER,0,.05+k*.1,.12+d/2));
  extrude(unit,frameShape(1.22,2.48,1.0,2.32),.2,PAPER,0,.3,.05);
  const hinge=group(unit,-.49,.32,.02);const panel=archShape(.97,2.28);
  const door=extrude(hinge,panel,.06,new T.Color(c.colors[i]).lerp(new T.Color(PAPER),.32).getStyle(),.485,0,0,{strength:.75});door.userData.keepColor=true;
  sphere(hinge,.045,'#d8b25a',.86,1.1,.06,{hull:.006});doors.push(hinge);
  // A small world behind each door.
  const w=group(p,x,0,FACADE_Z-1.05);worlds.push(w);box(w,1.55,.06,1.5,'#efe9dc',0,.03,0);
  if(i===0){box(w,.75,.62,.6,'#f3d9a8',0,.37,-.1,{strength:.8});extrude(w,gable(.9,.42),.66,'#e7907a',0,.68,-.1);box(w,.12,.32,.12,PAPER,.22,.95,-.18);const win=box(w,.2,.2,.02,'#ffd56f',0,.42,.21,{emissive:'#f5a83a',emissiveIntensity:.8,outline:'edges'});win.userData.keepColor=true;for(let k=0;k<5;k++)box(w,.03,.18,.03,PAPER,-.55+k*.27,.1,.55);box(w,1.15,.025,.025,PAPER,0,.17,.55);glow(w,'#ffb347',.9,0,.42,.3,.5);}
  if(i===1){lathe(w,[[0,0],[.3,0],[.3,.05],[.24,.08],[.22,1.7],[.3,1.75],[.3,1.82],[0,1.82]],'#d8d0f0',0,0,-.15,{strength:.8});lathe(w,[[0,0],[.34,0],[.02,.62],[0,.64]],'#a48fe0',0,1.82,-.15);cyl(w,.012,.012,.42,PAPER,0,2.6,-.15,{hull:.004});const flag=box(w,.22,.13,.01,'#f4c461',.11,2.73,-.15,{outline:'edges'});flag.userData.keepColor=true;for(let k=0;k<4;k++)box(w,.1,.14,.02,'#ffe39a',Math.cos(k*1.6)*.235,.5+k*.33,-.15+Math.sin(k*1.6)*.235,{emissive:'#f6c35a',emissiveIntensity:.5}).rotation.y=-k*1.6;}
  if(i===2){lathe(w,[[0,0],[.07,0],[.05,.75],[0,.75]],'#d9c2a1',-.3,0,-.25);[[0,.95,0,.38],[.24,.85,.1,.26],[-.22,.88,-.05,.28],[.05,1.18,-.08,.26]].forEach(([x,y,z,r])=>sphere(w,r,'#bfe0b9',-.3+x,y,-.25+z,{hull:.01}));for(let k=0;k<6;k++){const fx=.12+(k%3)*.2,fz=-.05+Math.floor(k/3)*.28;tube(w,[[fx,.06,fz],[fx,.28,fz]],.008,'#6c9f6a',{outline:'none',shadow:false});sphere(w,.055,['#f5c54c','#ef8fa8','#f08b62'][k%3],fx,.3,fz,{hull:.005}).userData.keepColor=true;}box(w,.5,.04,.16,PAPER,.3,.24,.45);for(const bx of [.1,.5])box(w,.04,.2,.14,PAPER,bx,.12,.45);}
 });
 const traveller=mannequin(p,PAPER,.9);
 const street=DOOR_X.map(x=>dashed(p,[[START[0],.08,START[2]],[x*.35,.08,.9],[x*.8,.08,-.3],[x,.08,-.72]],'#6b675c',.07));
 const chosen=DOOR_X.map((x,i)=>ribbon(p,[[START[0],.1,START[2]],[x*.35,.1,.9],[x*.8,.1,-.3],[x,.4,-.95],[x,.32,-1.6],[x+(i-1)*.25,.2,-2.15],[x+(i===1?0:.3),.2,-2.7]],c.colors[i],{width:.12,twist:.15}));
 const hums=DOOR_X.map((x,i)=>{const h=group(p,x,1.5,FACADE_Z+.25);return waves(h,c.colors[i],{count:3,size:.9,arc:Math.PI*2});});
 const rack=jarRack(p,c.stores.map((label,i)=>({label,color:c.colors[i]})),{x:2.05,z:1.5,ry:-.45,spacing:.66,r:.2,h:.62});
 const labels=['BELONGING','POSSIBILITY','A SLOWER LIFE'].map((t,i)=>card(p,[t],{w:1.3,h:.42,x:DOOR_X[i],y:3.25,z:FACADE_Z+.15,rx:-.1}));
 const notes=[['a warm window','someone waits'],['a tower','to climb'],['a garden','no hurry']].map((l,i)=>card(p,l,{w:1.15,h:.6,x:DOOR_X[i]+(i===2?-.2:.2),y:.33,z:.05,rx:-.5,accent:c.colors[i]}));
 const doorFront=(i:number):V3=>[DOOR_X[i],0,-.62];
 // Traveller position along the route to a door: pure in step/progress.
 const route=(i:number,t:number):{pos:V3;dist:number;yaw:number}=>{
  const pts:V3[]=[START,[DOOR_X[i]*.35,0,.9],[DOOR_X[i]*.8,0,-.3],doorFront(i),[DOOR_X[i],0,-1.45]];
  const curve=new T.CatmullRomCurve3(pts.map(v=>new T.Vector3(...v)));const len=curve.getLength();const u=clamp01(t);const at=curve.getPointAt(u),tan=curve.getTangentAt(Math.min(.999,Math.max(.001,u)));
  return {pos:[at.x,0,at.z],dist:u*len,yaw:Math.atan2(tan.x,tan.z)};
 };
 return {
  update(s,time){
   const open=s.amount/100;
   doors.forEach((d,i)=>{d.rotation.y=-(i===s.choice?open*1.85:s.alternate?.18:0);});
   units.forEach((_,i)=>{hums[i].update(time+i*.4,s.step===0?segment(s.progress,.3,.5)*(1-segment(s.progress,.9,1))*.9:i===s.choice&&s.step===1?.4*(1-open):0);});
   worlds.forEach((w,i)=>w.scale.setScalar(i===s.choice?mix(.75,1,open):.75));
   // Where the traveller is.
   let along=0;
   if(s.step===0)along=0;else if(s.step===1){along=s.playing?mix(0,.8,easeOut(segment(s.progress,0,.5)))+.18*segment(s.progress,.72,1):.8;}else along=.8;
   const r=route(s.choice,along);traveller.root.position.set(...r.pos);
   const walking=s.step===1&&s.playing&&s.progress<.5;
   if(walking||(s.step===1&&s.progress>.72&&s.playing))traveller.walk(r.dist*8.5,1);else traveller.pose({head:s.step===2?-.1:-.18,shoulders:.04,elbows:.2});
   traveller.root.rotation.y=s.step===0?Math.PI:s.step===2?mix(Math.PI,0,ease(segment(s.progress,.05,.3))):r.yaw;
   if(s.step===0)traveller.root.rotation.y=Math.PI+(s.choice-1)*.35;
   // Paths.
   street.forEach((l,i)=>l.visible=s.alternate||(s.step===2&&i!==s.choice)||(s.step===0&&s.progress>.34));
   chosen.forEach((rb,i)=>{if(i!==s.choice){rb.set(s.alternate?1:0);return;}const head=s.step===0?0:s.step===1?mix(segment(s.progress,0,.5)*.62,1,segment(s.progress,.6,.95)):1;rb.set(head,0);});
   const e=ease(segment(s.progress,.1,.85));const base=[.32,.32,.32];
   const lv=base.map((b,i)=>s.step===0?mix(.08,b,e):i===s.choice?(s.step===1?mix(b,.88,e):.88):(s.step===1?b:mix(b,.45,e)));
   rack.set(lv,lv.map(v=>`${Math.round(v*100)}%`));
   labels.forEach((l,i)=>l.mesh.visible=i===s.choice);notes.forEach(n=>n.mesh.visible=s.alternate);
  },
  camera(s){const t=s.progress,x=DOOR_X[s.choice];const tp=route(s.choice,s.step===1?mix(0,.8,easeOut(segment(t,0,.5))):.8).pos;
   if(s.step===0)return shotPath(t,[[0,shot([0,4.1,9.2],[0,1.3,-1.1])],[.34,shot([.6,1.5,3.9],[0,1.1,-1.1])],[.67,shot([x*.5,2.2,4.6],[x*.4,1.5,-1.2])]]);
   if(s.step===1)return shotPath(t,[[0,shot([tp[0]+1.8,1.9,tp[2]+2.6],[tp[0],.8,tp[2]-.6])],[.34,shot([x+1.1,1.6,.9],[x,1.3,-1.4])],[.67,shot([x+.2,4.3,.6],[x,.5,-2.4])]]);
   return shotPath(t,[[0,shot([0,5,5.6],[0,.6,-.4])],[.34,shot([-2.3,1.3,2.6],[0,.2,.3])],[.67,shot([.4,5.8,10.2],[0,1.2,-1])]]);
  }
 };
}
