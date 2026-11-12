import * as T from 'three';
import type {Concept} from '../concepts';
import {PAPER,INK,box,cyl,extrude,group,tube,card,jarRack,ribbon,waves,arrow,mannequin,setTint,shot,shotPath,ease,segment,mix,clamp01,type Model,type V3} from '../kit';

// The Shape of Everyday: a paper chair on a turntable. The control pulls it into an exploded
// technical drawing; later someone sits down and the load flows down through the legs.
function liveLine(p:T.Object3D){
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(6),3));
 const l=new T.Line(g,new T.LineDashedMaterial({color:INK,dashSize:.05,gapSize:.04,transparent:true,opacity:.8}));l.raycast=()=>{};p.add(l);
 return {line:l,set(a:V3,b:V3){const pos=g.attributes.position as T.BufferAttribute;pos.setXYZ(0,...a);pos.setXYZ(1,...b);pos.needsUpdate=true;l.computeLineDistances();g.computeBoundingSphere();}};
}
function seatShape(){const s=new T.Shape();s.moveTo(-.25,.29);s.lineTo(.25,.29);s.quadraticCurveTo(.34,.29,.34,.2);s.lineTo(.34,-.2);s.quadraticCurveTo(.34,-.3,.24,-.32);s.quadraticCurveTo(0,-.37,-.24,-.32);s.quadraticCurveTo(-.34,-.3,-.34,-.2);s.lineTo(-.34,.2);s.quadraticCurveTo(-.34,.29,-.25,.29);return s;}
// A bowed crest rail seen from above: an arc band between the two back posts.
const RAIL={R:.95,y0:-.53,phi:.355};
function railShape(){const s=new T.Shape(),n=24,{R,y0,phi}=RAIL;for(let i=0;i<=n;i++){const f=-phi+2*phi*i/n;const x=R*Math.sin(f),y=y0+R*Math.cos(f);if(i)s.lineTo(x,y);else s.moveTo(x,y);}for(let i=n;i>=0;i--){const f=-phi+2*phi*i/n;s.lineTo((R-.04)*Math.sin(f),y0+(R-.04)*Math.cos(f));}return s;}
const railZ=(x:number)=>-(RAIL.y0+(RAIL.R-.02)*Math.cos(Math.asin(Math.min(.99,x/(RAIL.R-.02)))));

export function buildEveryday(p:T.Group,c:Concept):Model{
 const [orange]=c.colors;
 // Plinth and a turntable with dial ticks; the chair turns with it.
 cyl(p,1.88,1.94,.08,PAPER,-.35,.04,-.3,{hull:.012});
 const table=group(p,-.35,.08,-.3);cyl(table,1.72,1.72,.04,PAPER,0,.02,0,{hull:.01});
 for(let i=0;i<24;i++){const a=i/24*Math.PI*2;const t=box(table,.035,.012,i%6?.1:.2,'#e9e1cf',Math.sin(a)*1.58,.046,Math.cos(a)*1.58,{threshold:30});t.rotation.y=a;}
 const chair=group(table,0,.04,0);
 // Structure: four tapered legs and their stretchers.
 const legs=group(chair,0,0,0,0);
 const corners=[[-1,-1],[1,-1],[-1,1],[1,1]] as const;
 const legGroups=corners.map(([sx,sz])=>{const g=group(legs,sx*.27,0,sz*.24);cyl(g,.032,.02,.505,PAPER,0,.2525,0,{hull:.008});cyl(g,.026,.026,.02,PAPER,0,.012,0,{hull:.006});g.rotation.set(-sz*.06,0,sx*.06);return g;});
 const rails=([['x',0,-1],['x',0,1],['z',-1,0],['z',1,0]] as const).map(([axis,sx,sz])=>{const g=group(legs,sx*.27,.17,sz*.24);const m=cyl(g,.016,.016,axis==='x'?.52:.46,PAPER,0,0,0,{hull:.006});if(axis==='x')m.rotation.z=Math.PI/2;else m.rotation.x=Math.PI/2;return {g,axis,sx,sz};});
 // Support: a dished, bow-fronted seat.
 const seat=group(chair,0,0,0,1);const slab=extrude(seat,seatShape(),.055,PAPER,0,.5325,0);slab.rotation.x=-Math.PI/2;
 box(seat,.58,.05,.04,PAPER,0,.48,.26);box(seat,.58,.05,.04,PAPER,0,.48,-.24);
 // Character: raked back posts, spindles and a bowed crest rail.
 const back=group(chair,0,0,0,2);
 for(const sx of [-1,1])tube(back,[[sx*.29,.5,-.26],[sx*.3,.9,-.31],[sx*.31,1.27,-.37]],.028,PAPER,{hull:.008});
 const rail=extrude(back,railShape(),.13,PAPER,0,1.205,0);rail.rotation.x=-Math.PI/2;
 for(const x of [-.18,-.06,.06,.18])tube(back,[[x,.56,-.25],[x,.86,-.3],[x,1.14,railZ(x)]],.015,PAPER,{hull:.006});
 const parts=[legs,seat,back];
 // Exploded-view construction lines and labels.
 const legLines=corners.map(()=>liveLine(chair));const backLines=[-1,1].map(()=>liveLine(chair));
 const labels=['STRUCTURE','SUPPORT','CHARACTER'].map((t,i)=>card(chair,[t],{w:.95,h:.36,accent:c.colors[i]}));
 const notes=[['4 legs','share the load'],['46 cm','about knee height'],['12° rake','a gentle lean']].map((l,i)=>card(chair,l,{w:.95,h:.52,accent:c.colors[i]}));
 // The sitter, the load paths and the floor's answer.
 const person=mannequin(chair,PAPER,2.5);
 const loads=corners.map(([sx,sz],i)=>ribbon(chair,[[sx*.05,.6,sz*.05],[sx*.22,.52,sz*.2],[sx*.26,.3,sz*.23],[sx*.27,.04,sz*.24],[sx*.5,.03,sz*.45]],i%2?c.accent:orange,{width:.06,twist:1}));
 const feetArrows=corners.map(([sx,sz])=>arrow(chair,[sx*.4,.42,sz*.36],[sx*.4,.06,sz*.36],c.accent,.022));
 const floorRings=waves(chair,c.accent,{rx:-Math.PI/2,y:.012,count:3,size:1.2});
 const rack=jarRack(p,c.stores.map((label,i)=>({label,color:c.colors[i]})),{x:1.9,z:-2.45,ry:-.35,spacing:.72,r:.23,h:.72});
 const levelsFor=(step:number,t:number)=>{const e=ease(t);return step===0?[.25+.4*e,.2+.3*e,.15+.3*e]:step===1?[.65+.1*e,.5+.25*e,.45+.3*e]:[.75+.2*ease(segment(t,.45,.95)),.75+.15*ease(segment(t,.45,.95)),.75];};
 return {
  update(s,time){
   const d=clamp01(s.amount/100),pr=s.progress;
   table.rotation.y=-.5+(s.step===0?ease(segment(pr,.3,.82))*Math.PI*2:0);
   // Exploded view: each family of parts moves along its assembly axis.
   legGroups.forEach((g,i)=>{const [sx,sz]=corners[i];g.position.set(sx*(.27+.38*d),0,sz*(.24+.34*d));});
   rails.forEach(r=>{r.g.position.set(r.sx*(.27+.38*d),.17-.1*d,r.sz*(.24+.34*d));if(r.axis==='x')r.g.scale.x=1+1.4*d;else r.g.scale.z=1+1.42*d;});
   seat.position.y=.55*d;seat.rotation.x=-.08*d;back.position.set(0,1.0*d,-.45*d);back.rotation.x=-.14*d;
   legLines.forEach((l,i)=>{const [sx,sz]=corners[i];l.set([sx*(.27+.38*d)-sx*.03,.5,sz*(.24+.34*d)-sz*.03],[sx*.25,.505+.55*d,sz*.22]);l.line.visible=d>.04;});
   backLines.forEach((l,i)=>{const sx=i?1:-1;l.set([sx*.29,.5+1.0*d,-.26-.45*d],[sx*.29,.56+.55*d,-.26]);l.line.visible=d>.04;});
   // Colour only where it means something: the chosen part, or the whole palette.
   parts.forEach((g,i)=>setTint(g,c.colors[i],s.alternate?.78:i===s.choice?.42:0));
   const labelAt:V3[]=[[.82+.3*d,.32,.55+.3*d],[.86,.7+.55*d,.1],[0,1.55+d,-.4-.45*d]];
   labels.forEach((l,i)=>{l.mesh.position.set(...labelAt[i]);l.mesh.visible=i===s.choice||d>.6;});
   const noteAt:V3[]=[[-.95-.3*d,.35,.55+.3*d],[-.95,.75+.55*d,-.05],[-.75,1.3+d,-.45-.45*d]];
   notes.forEach((n,i)=>{n.mesh.position.set(...noteAt[i]);n.mesh.visible=s.alternate;});
   // Step 3: walk over, turn and sit; the weight travels down the legs into the floor.
   const calm=1-clamp01(d*4),seated=s.step===2;
   const walkT=seated?segment(pr,.26,.44)*calm:0,sitT=seated?ease(segment(pr,.42,.6))*calm:0;
   const stand:V3=[1.15,0,.7],front:V3=[0,0,.62],sit:V3=[0,-.59,.07];
   const at:V3=sitT>0?[mix(front[0],sit[0],sitT),mix(front[1],sit[1],sitT),mix(front[2],sit[2],sitT)]:[mix(stand[0],front[0],ease(walkT)),0,mix(stand[2],front[2],ease(walkT))];
   person.root.visible=s.step===2||s.alternate;person.root.position.set(...at);
   person.root.rotation.y=sitT>0||walkT>=1?0:walkT>0?mix(-Math.PI/2,-Math.PI/2+.2,walkT):-2.1;
   if(walkT>0&&walkT<1)person.walk(time*7.5,1);else person.pose({hips:sitT*Math.PI/2,knees:sitT*Math.PI/2,shoulders:sitT*.55,elbows:.15+sitT*.75,lean:-.06*sitT,head:sitT?.08:.18});
   const flowing=seated&&pr>.55&&d<.2;
   loads.forEach((l,i)=>{if(!flowing){l.set(0,0);return;}const h=((time*.45+i*.17)%1.35);l.set(h,h-.5);});
   feetArrows.forEach((a,i)=>{a.visible=flowing&&pr>.66;a.position.y=.42+Math.sin(time*3+i)*.02;});
   floorRings.update(time,flowing?segment(pr,.6,.75):0);
   const lv=levelsFor(s.step,segment(pr,.1,.85));rack.set(lv,lv.map(v=>`${Math.round(v*100)}%`));
  },
  camera(s){const t=s.progress,lift=s.amount/100;
   if(s.step===0)return shotPath(t,[[0,shot([.6,3.6,8.4],[-.2,.8,-.6])],[.34,shot([-2.5,2.0,4.0],[-.35,.65,-.3])],[.67,shot([1.5,1.9,3.5],[.6,.85,-1.4])]]);
   if(s.step===1)return shotPath(t,[[0,shot([2.7,3.0+lift,5.8],[-.35,.9+lift*.5,-.3])],[.34,shot([.9,1.2+lift*.6,2.4],[-.35,.6+lift*.5,-.3])],[.67,shot([0,3.3,7.2],[-.25,1.2,-.6])]]);
   return shotPath(t,[[0,shot([-1.9,2.4,5.6],[-.35,1.0,-.3])],[.34,shot([1.9,1.7,4.1],[-.3,.9,-.15])],[.67,shot([.7,.75,3.1],[-.35,.35,-.25])]]);
  }
 };
}
