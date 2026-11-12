import * as T from 'three';
import type {Concept} from '../concepts';
import {PAPER,box,sphere,lathe,extrude,solid,group,card,jarRack,waves,dashed,mannequin,setTint,archShape,shot,shotPath,ease,segment,mix,clamp01,type Model,type V3} from '../kit';

// Forms of Silence: a paper gallery of nine forms. As the count drops, forms fold back into
// the page, their footprints remain as dotted outlines, the noise rings fade and the last
// form is left with a long shadow. Stores: noise drains, space fills.
function frameShape(w:number,h:number,iw:number,ih:number){const r=w/2,ir=iw/2;const s=new T.Shape();s.moveTo(-r,0);s.lineTo(-r,h-r);s.absarc(0,h-r,r,Math.PI,0,true);s.lineTo(r,0);s.lineTo(ir,0);s.lineTo(ir,ih-ir);s.absarc(0,ih-ir,ir,0,Math.PI,false);s.lineTo(-ir,0);s.lineTo(-r,0);return s;}
type Spec={type:0|1|2;x:number;z:number;make:(g:T.Group)=>void};
const plinth=(g:T.Group,w:number,h:number,d=w)=>{const m=box(g,w,h,d,PAPER,0,h/2,0);m.userData.keepColor=true;m.traverse(o=>o.userData.keepColor=true);return h;};
const specs:Spec[]=[
 {type:0,x:0,z:-1.85,make:g=>{const top=plinth(g,1.2,.12,.5);extrude(g,frameShape(1.05,1.75,.6,1.35),.32,PAPER,0,top,0);}},
 {type:1,x:-1.4,z:-1.85,make:g=>{const top=plinth(g,.42,1.0);sphere(g,.24,PAPER,0,top+.24,0);}},
 {type:2,x:1.4,z:-1.85,make:g=>{const top=plinth(g,.7,.1,.45);box(g,.5,1.65,.24,PAPER,0,top+.825,0);}},
 {type:1,x:-1.4,z:-.5,make:g=>{const top=plinth(g,.95,.32);sphere(g,.46,PAPER,0,top+.46,0);}},
 {type:0,x:0,z:-.5,make:g=>{const top=plinth(g,1.1,.08,.4);for(const x of [-.27,.27])extrude(g,frameShape(.5,.95,.26,.7),.22,PAPER,x,top,0);}},
 {type:2,x:1.4,z:-.5,make:g=>{const top=plinth(g,.62,.14);const ob=solid(g,new T.CylinderGeometry(.09,.22,1.9,4),PAPER,[0,top+.95,0],{threshold:20});ob.rotation.y=Math.PI/4;const tip=solid(g,new T.ConeGeometry(.13,.26,4),PAPER,[0,top+2.02,0],{threshold:20});tip.rotation.y=Math.PI/4;}},
 {type:2,x:-1.4,z:.85,make:g=>{const top=plinth(g,.75,.06);[[.62,.22,.42,.2],[.48,.26,.36,-.25],[.36,.3,.28,.35]].reduce((y,[w,h,d,r])=>{const b=box(g,w,h,d,PAPER,0,y+h/2,0);b.rotation.y=r;return y+h;},top);}},
 {type:1,x:0,z:.85,make:g=>{const top=plinth(g,.5,.5);lathe(g,[[0,0],[.12,0],[.13,.03],[.24,.2],[.27,.36],[.2,.55],[.09,.66],[.08,.76],[.11,.8],[.1,.82],[.06,.8],[0,.8]],PAPER,0,top,0);}},
 {type:0,x:1.4,z:.85,make:g=>{const top=plinth(g,1.2,.06,.36);extrude(g,frameShape(1.1,.8,.72,.6),.18,PAPER,0,top,0);}},
];
const heroOf=[0,3,5];

export function buildSilence(p:T.Group,c:Concept):Model{
 // Gallery shell: floor and a back wall with a tall arched niche.
 box(p,5.8,.05,4.6,'#f4f0e6',0,.025,-.55);
 const wall=new T.Shape();wall.moveTo(-2.9,0);wall.lineTo(2.9,0);wall.lineTo(2.9,2.9);wall.lineTo(-2.9,2.9);wall.lineTo(-2.9,0);const niche=archShape(1.5,2.5);wall.holes.push(new T.Path(niche.getPoints(32).map(v=>new T.Vector2(v.x,v.y+.06))));
 extrude(group(p,0,0,-2.95),wall,.12,'#f1ece0');box(p,1.7,2.65,.06,'#e9e2d3',0,1.33,-3.12);for(const x of [-.8,.8])box(p,.08,2.6,.2,'#efe9dc',x,1.3,-3.03);
 const forms=specs.map((s,i)=>{const g=group(p,s.x,0,s.z,s.type);s.make(g);g.userData.index=i;return g;});
 const prints=specs.map(s=>{const w=.62,d=.42;return dashed(p,[[s.x-w,.06,s.z-d],[s.x+w,.06,s.z-d],[s.x+w,.06,s.z+d],[s.x-w,.06,s.z+d],[s.x-w,.06,s.z-d]],'#8a8577',.06);});
 const order=(choice:number)=>{const h=specs[heroOf[choice]];return specs.map((s,i)=>({i,d:i===heroOf[choice]?-1:Math.hypot(s.x-h.x,s.z-h.z)+(s.type===choice?.01:0)})).sort((a,b)=>a.d-b.d).map(o=>o.i);};
 const noise=[[-1.4,1.75,-1.85],[1.4,2.5,-.5],[0,1.65,.85]].map(([x,y,z],i)=>{const holder=group(p,x,y,z);holder.rotation.z=i===0?Math.PI*.78:-Math.PI*.22;return waves(holder,'#e982a1',{count:4,size:.7,arc:Math.PI*.45});});
 const floorRings=waves(p,c.accent,{rx:-Math.PI/2,count:3,size:.85});
 const visitor=mannequin(p,PAPER,.95);visitor.root.position.set(-2.35,.05,1.75);visitor.root.rotation.y=2.55;
 const rack=jarRack(p,c.stores.map((label,i)=>({label,color:['#e982a1','#3169db','#ebbf4e'][i]})),{x:2.55,z:-.55,ry:-1.25,spacing:.7,r:.21,h:.68});
 const labels=['THE ARCH','THE SPHERE','THE MONOLITH'].map(t=>card(p,[t],{w:1.15,h:.4,rx:-.12}));
 const notes=[['the opening','is part of the form'],['soft edges','against straight walls'],['one shadow','completes it']].map((l,i)=>card(p,l,{w:1.25,h:.62,accent:c.colors[i],rx:-.1}));
 const plaque=card(p,['let the room','breathe'],{w:1.5,h:.62,x:0,y:2.45,z:-2.86});
 const spreadOf=(alt:boolean)=>alt?1.18:1;
 const posOf=(i:number,alt:boolean):V3=>{const s=specs[i],k=spreadOf(alt);return [s.x*k,0,-.55+(s.z+.55)*k];};
 const heroAt=(choice:number,alt:boolean)=>posOf(heroOf[choice],alt);
 return {
  sun:s=>{const low=1-clamp01((s.amount-1)/8);return [mix(-6.5,-9,low),mix(12.5,4.4,low),mix(6,3.2,low)];},
  update(s,time){
   const count=s.amount,ranks=order(s.choice);
   forms.forEach((g,i)=>{const rank=ranks.indexOf(i);const fold=clamp01(rank+1-count);const [x,,z]=posOf(i,s.alternate);g.position.set(x,0,z);g.rotation.x=-fold*1.25;g.scale.set(1,Math.max(.02,1-fold*.96),1);g.visible=fold<.999;setTint(g,c.colors[specs[i].type],specs[i].type===s.choice?.42:0);prints[i].visible=fold>.5;prints[i].position.set(x-specs[i].x,0,z-specs[i].z);});
   const loud=clamp01((count-1.5)/7.5);noise.forEach((w,i)=>w.update(time+i*.3,loud*(s.step===0?mix(.6,1,segment(s.progress,.3,.5)):1)));
   const h=heroAt(s.choice,s.alternate);floorRings.group.position.set(h[0],.07,h[2]);floorRings.update(time,1);
   labels.forEach((l,i)=>{l.mesh.visible=i===s.choice;const a=heroAt(i,s.alternate);l.mesh.position.set(a[0]+.15,i===2?2.55:i===0?2.25:1.7,a[2]+.45);});
   notes.forEach((n,i)=>{n.mesh.visible=s.alternate;const a=heroAt(i,s.alternate);n.mesh.position.set(a[0]+(i===2?-.55:.75),.75,a[2]+.6);});
   plaque.mesh.visible=count<1.6;
   const n=clamp01((count-1)/8);const e=ease(segment(s.progress,.1,.8));const noiseLevel=mix(.08,.88,n);const space=mix(.92,.1,n);
   rack.set([s.step===0?mix(.4,noiseLevel,e):noiseLevel,mix(.35,.75,1-n),s.step===0?mix(.05,space,e):space],[`${Math.round(28+n*54)} dB`,`${Math.round(count)}`,`${Math.round((1-n)*100)}%`]);
   visitor.pose({head:-.12+Math.sin(time*.5)*.05,shoulders:.05,elbows:.35,lean:.04});
  },
  camera(s){const t=s.progress,h=heroAt(s.choice,s.alternate);
   if(s.step===0)return shotPath(t,[[0,shot([.4,4.4,9],[0,1.1,-.7])],[.34,shot([-2.2,2.2,3.6],[-.2,1.3,-1])],[.67,shot([.9,2.2,2.2],[2.5,.9,-.6])]]);
   if(s.step===1)return shotPath(t,[[0,shot([2.6,1.9,3.8],[.6,.8,-.2])],[.34,shot([0,7.2,3.2],[0,.2,-.6])],[.67,shot([1.0,2.1,2.0],[2.5,.9,-.55])]]);
   return shotPath(t,[[0,shot([h[0]+.4,1.6,h[2]+3.1],[h[0],1.0,h[2]])],[.34,shot([h[0]+2.6,.9,h[2]+2.4],[h[0]+.6,.4,h[2]+.6])],[.67,shot([.3,5.8,10.4],[0,1,-.7])]]);
  }
 };
}
