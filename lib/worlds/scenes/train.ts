import * as T from 'three';
import type {Concept} from '../concepts';
import {PAPER,box,cyl,sphere,lathe,extrude,group,tube,card,jarRack,ribbon,waves,glow,pool,mannequin,paper,hullMaterial,shot,shotPath,ease,segment,mix,clamp01,type Model,type V3} from '../kit';

// After the Last Train: a paper city block at night. The last train leaves the platform, two
// strangers walk to the only lit bakery, and at dawn the first train crosses the river.
const TRACK:V3[]=[[-2.3,.08,1.3],[-2.5,.08,-1.0],[-1.4,.08,-2.3],[.6,.08,-2.4],[2.2,.34,-1.7],[2.6,.08,-.2],[2.2,.08,1.3],[.4,.08,1.95]];
const RIVER:V3[]=[[1.0,.055,-3.25],[1.7,.055,-2.45],[2.2,.055,-1.75],[2.65,.055,-1.3],[3.0,.055,-.95]];
const BAKERY:V3=[-.6,0,-1.25],BENCH:V3=[2.82,0,-1.95],RACK:V3=[1.2,0,.62];
function gable(w:number,h:number){const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(0,h);s.lineTo(-w/2,0);return s;}
function carriage(p:T.Object3D,color:string,loco:boolean){
 const g=group(p);g.rotation.order='YXZ';const s=new T.Shape();s.moveTo(-.48,0);s.lineTo(.48,0);s.lineTo(.48,.3);s.quadraticCurveTo(.48,.42,.34,.42);s.lineTo(-.34,.42);s.quadraticCurveTo(-.48,.42,-.48,.3);s.lineTo(-.48,0);
 const body=extrude(g,s,.4,color,0,.12,0,{strength:.8});body.rotation.y=Math.PI/2;body.userData.keepColor=true;
 box(g,.3,.06,.86,'#5f5a52',0,.11,0,{strength:.6});box(g,.42,.025,.78,PAPER,0,.555,0);
 const windows:T.Mesh[]=[];for(const side of [-1,1])for(let k=0;k<4;k++){const w=box(g,.02,.13,.14,'#2f3352',side*.207,.4,-.3+k*.2,{strength:.3});w.userData.keepColor=true;windows.push(w);}
 const wheels:T.Mesh[]=[];for(const x of [-.17,.17])for(const z of [-.3,.3]){const w=cyl(g,.075,.075,.05,'#3d3b37',x,.085,z,{hull:.005});w.rotation.z=Math.PI/2;wheels.push(w);}
 if(loco){lathe(g,[[0,0],[.06,0],[.05,.14],[.09,.2],[.09,.23],[0,.23]],'#3d3b37',0,.52,.26);box(g,.42,.17,.26,color,0,.62,-.24,{strength:.8}).userData.keepColor=true;const lamp=sphere(g,.06,'#ffe28a',0,.34,.5,{outline:'none',emissive:'#ffcf5a',emissiveIntensity:1});lamp.userData.keepColor=true;glow(g,'#ffd36b',.7,0,.34,.58,.7);}
 return {g,windows,wheels};
}

export function buildTrain(p:T.Group,c:Concept):Model{
 const [red,gold,blue]=c.colors;
 box(p,5.9,.05,5.7,'#eeeae1',0,.025,-.45);
 // Sky backdrop that warms from midnight to dawn, with a cut-paper skyline in front.
 const sky=box(p,5.9,2.7,.06,'#2e3566',0,1.38,-3.18,{strength:.22});const skyMat=sky.material as T.MeshStandardMaterial;sky.userData.keepColor=true;
 const skyline=new T.Shape();skyline.moveTo(-2.95,0);[[-2.95,.7],[-2.4,.7],[-2.4,1.1],[-1.9,1.1],[-1.9,.55],[-1.2,.55],[-1.2,1.35],[-.8,1.35],[-.8,.8],[0,.8],[0,1.05],[.5,1.05],[.5,.6],[1.3,.6],[1.3,1.25],[1.7,1.25],[1.7,.75],[2.4,.75],[2.4,.95],[2.95,.95],[2.95,0]].forEach(([x,y])=>skyline.lineTo(x,y));
 extrude(group(p,0,0,-2.98),skyline,.06,'#d9d3c6',0,0,0,{strength:.7});
 const moon=sphere(p,.18,'#f4e6b0',-1.7,2.15,-3.1,{outline:'none',emissive:'#f2dc9a',emissiveIntensity:.6});moon.scale.z=.2;moon.userData.keepColor=true;
 const stars=Array.from({length:14},(_,i)=>{const st=sphere(p,.022+(i%3)*.01,'#fff6d4',-2.6+(i*.83)%5.2,1.55+(i*.37)%1.05,-3.12,{outline:'none',shadow:false,emissive:'#fff1c0',emissiveIntensity:.8});st.userData.keepColor=true;return st;});
 const sun=sphere(p,.28,'#ffc66b',1.75,.5,-3.1,{outline:'none',emissive:'#ffab3d',emissiveIntensity:.9});sun.scale.z=.25;sun.userData.keepColor=true;const sunGlow=glow(p,'#ffb35a',2.2,1.75,.5,-3.0,.6);
 // Track: rails, sleepers, ramp over the river.
 const curve=new T.CatmullRomCurve3(TRACK.map(v=>new T.Vector3(...v)),true,'catmullrom',.5);const len=curve.getLength();
 const railPts=(side:number):V3[]=>Array.from({length:120},(_,i)=>{const u=i/120,v=curve.getPointAt(u),t=curve.getTangentAt(u);const n=new T.Vector3(t.z,0,-t.x).normalize();return [v.x+n.x*side,v.y+.045,v.z+n.z*side];});
 for(const side of [-.09,.09])tube(p,railPts(side),.018,'#b9b2a2',{closed:true,segments:240,hull:.005,shadow:false});
 const sleeperGeo=new T.BoxGeometry(.34,.035,.08),SLEEPERS=78;const sleepers=new T.InstancedMesh(sleeperGeo,paper('#d8c6a4',{strength:.6}),SLEEPERS);const sleeperHull=new T.InstancedMesh(sleeperGeo,hullMaterial(.006),SLEEPERS);sleepers.receiveShadow=sleepers.castShadow=true;sleepers.userData.keepColor=true;sleeperHull.raycast=()=>{};
 {const m=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(0,0,0,'YXZ'),one=new T.Vector3(1,1,1);for(let i=0;i<SLEEPERS;i++){const u=i/SLEEPERS,v=curve.getPointAt(u),t=curve.getTangentAt(u);e.set(-Math.asin(t.y),Math.atan2(t.x,t.z),0);q.setFromEuler(e);m.compose(new T.Vector3(v.x,v.y+.01,v.z),q,one);sleepers.setMatrixAt(i,m);sleeperHull.setMatrixAt(i,m);}}
 p.add(sleepers);p.add(sleeperHull);
 const nearestU=(x:number,z:number)=>{let best=0,bd=Infinity;for(let i=0;i<500;i++){const v=curve.getPointAt(i/500);const d=(v.x-x)**2+(v.z-z)**2;if(d<bd){bd=d;best=i/500;}}return best;};
 const uPlat=nearestU(-1.0,1.75),uBake=nearestU(-1.3,-2.25),uRiver=nearestU(2.45,-1.0),uBridge=nearestU(2.2,-1.7);
 // River with flowing paper texture, and a bridge where the track crosses it.
 const rc=new T.CatmullRomCurve3(RIVER.map(v=>new T.Vector3(...v)));const RN=60,rpos:number[]=[],ruv:number[]=[],ridx:number[]=[];
 for(let i=0;i<=RN;i++){const u=i/RN,v=rc.getPointAt(u),t=rc.getTangentAt(u);const n=new T.Vector3(t.z,0,-t.x).normalize().multiplyScalar(.3);rpos.push(v.x+n.x,.055,v.z+n.z,v.x-n.x,.055,v.z-n.z);ruv.push(u*4,0,u*4,1);if(i<RN){const k=i*2;ridx.push(k,k+2,k+1,k+1,k+2,k+3);}}
 const rg=new T.BufferGeometry();rg.setAttribute('position',new T.Float32BufferAttribute(rpos,3));rg.setAttribute('uv',new T.Float32BufferAttribute(ruv,2));rg.setIndex(ridx);rg.computeVertexNormals();
 const waterCanvas=document.createElement('canvas');waterCanvas.width=256;waterCanvas.height=64;const wx=waterCanvas.getContext('2d')!;wx.fillStyle='#86bde2';wx.fillRect(0,0,256,64);for(let i=0;i<9;i++){wx.strokeStyle='rgba(255,255,255,.55)';wx.lineWidth=2;wx.beginPath();const y=6+i*6.5;for(let x=0;x<=256;x+=16)wx.lineTo(x,y+Math.sin(x*.07+i*1.7)*2.2);wx.stroke();}
 const waterTex=new T.CanvasTexture(waterCanvas as HTMLCanvasElement);waterTex.wrapS=waterTex.wrapT=T.RepeatWrapping;waterTex.colorSpace=T.SRGBColorSpace;
 const river=new T.Mesh(rg,new T.MeshStandardMaterial({map:waterTex,color:'#ffffff',roughness:.35,emissive:'#2f6fa6',emissiveIntensity:.12}));river.receiveShadow=true;river.userData.keepColor=true;p.add(river);
 const bp=curve.getPointAt(uBridge),bt=curve.getTangentAt(uBridge);const bridge=group(p,bp.x,0,bp.z);bridge.rotation.y=Math.atan2(bt.x,bt.z);
 box(bridge,.52,.05,1.25,PAPER,0,.3,0);const archBody=extrude(bridge,(()=>{const s=new T.Shape();s.moveTo(-.62,0);s.lineTo(-.4,0);s.absarc(0,0,.4,Math.PI,0,true);s.lineTo(.62,0);s.lineTo(.62,.28);s.lineTo(-.62,.28);s.lineTo(-.62,0);return s;})(),.44,PAPER);archBody.rotation.y=Math.PI/2;
 for(const x of [-.25,.25]){box(bridge,.03,.03,1.25,PAPER,x,.44,0);for(let k=0;k<6;k++)box(bridge,.025,.13,.025,PAPER,x,.37,-.55+k*.22);}
 // Platform with canopy, clock and bench.
 const pp=curve.getPointAt(uPlat),pt=curve.getTangentAt(uPlat);const pn=new T.Vector3(pt.z,0,-pt.x).normalize();if(pn.dot(new T.Vector3(pp.x,0,pp.z+.3))<0)pn.negate();
 const platform=group(p,pp.x+pn.x*.5,0,pp.z+pn.z*.5,0);platform.rotation.y=Math.atan2(pn.x,pn.z);
 box(platform,2.0,.18,.62,PAPER,0,.09,0);const edge=box(platform,2.0,.012,.06,gold,0,.186,-.27);edge.userData.keepColor=true;
 for(const x of [-.8,0,.8])cyl(platform,.022,.022,1.05,PAPER,x,.7,.18,{hull:.005});
 const roofShape=new T.Shape();roofShape.moveTo(-.42,0);roofShape.quadraticCurveTo(0,.2,.42,0);roofShape.lineTo(.42,-.035);roofShape.quadraticCurveTo(0,.165,-.42,-.035);roofShape.lineTo(-.42,0);
 extrude(platform,roofShape,2.15,PAPER,0,1.24,.05).rotation.y=Math.PI/2;
 const clock=group(platform,.45,1.0,.24);cyl(clock,.012,.012,.18,PAPER,0,.15,0,{hull:.004});const face=cyl(clock,.17,.17,.04,'#fffaf0',0,0,0,{hull:.008});face.rotation.x=Math.PI/2;
 const hourHand=group(clock,0,0,.03),minuteHand=group(clock,0,0,.035);box(hourHand,.02,.1,.008,'#26241f',0,.045,0,{outline:'none'});box(minuteHand,.014,.14,.008,'#26241f',0,.065,0,{outline:'none'});
 const clockCard=card(platform,['00:12'],{w:.62,h:.32,x:-.35,y:.42,z:.3,rx:-.2});
 box(platform,.6,.05,.18,PAPER,-.45,.42,.16);for(const x of [-.7,-.2])box(platform,.04,.24,.14,PAPER,x,.3,.16);
 const toWorld=(lx:number,lz:number):V3=>{const a=platform.rotation.y;return [platform.position.x+lx*Math.cos(a)+lz*Math.sin(a),.18,platform.position.z-lx*Math.sin(a)+lz*Math.cos(a)];};
 // The bakery: the only warm window at midnight.
 const bakery=group(p,...BAKERY,1);box(bakery,1.3,.95,.85,'#f6e8d2',0,.475,0,{strength:.85});extrude(bakery,gable(1.46,.45),.95,'#e9a184',0,.95,0,{strength:.8});box(bakery,.15,.38,.15,PAPER,.4,1.22,-.15);
 const awning=box(bakery,1.1,.03,.34,gold,0,.74,.52);awning.rotation.x=.38;awning.userData.keepColor=true;
 const bakeryWindows=[-.35,.35].map(x=>{const w=box(bakery,.3,.26,.02,'#3a3d55',x,.42,.435,{strength:.3});w.userData.keepColor=true;return w;});box(bakery,.24,.44,.02,'#c98a5f',0,.22,.435).userData.keepColor=true;
 card(bakery,['BAKERY'],{w:.62,h:.17,x:0,y:.85,z:.45,hand:false});const bakeryPool=pool(p,'#ffb347',1.0,BAKERY[0],.06,BAKERY[2]+.85,0);const bakeryGlow=glow(bakery,'#ffb347',1.4,0,.45,.6,0);
 const steam=[0,1].map(i=>ribbon(p,[[BAKERY[0]+.4,1.42,BAKERY[2]-.15],[BAKERY[0]+.5+i*.08,1.75,BAKERY[2]-.1],[BAKERY[0]+.32,2.05,BAKERY[2]-.18],[BAKERY[0]+.48,2.4,BAKERY[2]-.12]],'#f2b07c',{width:.07,twist:2.4}));
 // Other buildings and street lamps.
 const tower=group(p,.75,0,-1.35);box(tower,.75,1.65,.65,'#ece6da',0,.825,0,{strength:.85});box(tower,.82,.07,.72,PAPER,0,1.68,0);
 const towerWindows:T.Mesh[]=[];for(let r=0;r<4;r++)for(let k=0;k<2;k++){const w=box(tower,.14,.18,.02,'#3a3d55',-.16+k*.32,.4+r*.33,.33,{strength:.3});w.userData.keepColor=true;towerWindows.push(w);}
 const house=group(p,-1.55,0,-.1);box(house,.62,.52,.55,'#efe7da',0,.26,0);extrude(house,gable(.72,.34),.6,'#c9d3e6',0,.52,0);const houseWindow=box(house,.16,.16,.02,'#3a3d55',0,.28,.28,{strength:.3});houseWindow.userData.keepColor=true;
 const lamps=[[-.1,.3],[.45,-.35],[-1.75,.75]].map(([x,z])=>{const l=group(p,x,0,z);cyl(l,.018,.024,.9,PAPER,0,.45,0,{hull:.004});const bulb=sphere(l,.06,'#fff1c4',0,.93,0,{outline:'none',emissive:'#ffd27a',emissiveIntensity:1});bulb.userData.keepColor=true;return {bulb,halo:glow(l,'#ffd27a',.7,0,.93,0,.6)};});
 // River bench, the dawn stop.
 const bank=group(p,...BENCH,2);box(bank,.7,.05,.24,PAPER,0,.26,0);for(const x of [-.28,.28])box(bank,.05,.25,.2,PAPER,x,.125,0);box(bank,.7,.18,.03,PAPER,0,.4,-.11);cyl(bank,.02,.02,.95,PAPER,.5,.475,-.05,{hull:.004});const dawnLamp=sphere(bank,.06,'#fff1c4',.5,.98,-.05,{outline:'none',emissive:'#ffd27a',emissiveIntensity:1});dawnLamp.userData.keepColor=true;
 // Train: locomotive and one carriage.
 const loco=carriage(p,red,true),coach=carriage(p,red,false);
 const strangers=[mannequin(p,PAPER,.5),mannequin(p,PAPER,.47)];
 const starts=[toWorld(-.15,.05),toWorld(.25,.12)];
 const doorFront=(i:number):V3=>[BAKERY[0]+(i?.22:-.18),0,BAKERY[2]+.72];const benchFront=(i:number):V3=>[BENCH[0]+(i?.2:-.2),0,BENCH[2]+.32];
 const rack=jarRack(p,c.stores.map((label,i)=>({label,color:['#3b4a8c',gold,'#f29a6a'][i]})),{x:RACK[0],z:RACK[2],ry:-.35,spacing:.66,r:.2,h:.62});
 const rings=waves(p,c.accent,{rx:-Math.PI/2,count:3,size:.8});
 const stationAt=():V3[]=>[[platform.position.x,.2,platform.position.z],[BAKERY[0],.06,BAKERY[2]+.6],[BENCH[0],.06,BENCH[2]]];
 const labels=['PLATFORM','BAKERY','RIVER'].map(t=>card(p,[t],{w:1.0,h:.38,rx:-.12}));
 const notes=[['00:12','the plan falls apart'],['warm bread','a shared table'],['first light','a new route']].map((l,i)=>card(p,l,{w:1.15,h:.6,accent:[red,gold,blue][i],rx:-.15}));
 const placeOn=(g:T.Group,u:number,lift=.04)=>{u=((u%1)+1)%1;const v=curve.getPointAt(u),t=curve.getTangentAt(u);g.position.set(v.x,v.y+lift,v.z);g.rotation.set(-Math.asin(t.y),Math.atan2(t.x,t.z),0);};
 const walkTo=(f:ReturnType<typeof mannequin>,from:V3,to:V3,t:number,moving:boolean)=>{const k=ease(t);f.root.position.set(mix(from[0],to[0],k),mix(from[1],to[1],k),mix(from[2],to[2],k));const d=Math.hypot(to[0]-from[0],to[2]-from[2]);if(moving&&t>0&&t<1){f.root.rotation.y=Math.atan2(to[0]-from[0],to[2]-from[2]);f.walk(d*k*14,1);}else f.pose({shoulders:.05,elbows:.25,head:-.05});};
 return {
  sun:s=>{const a=s.amount/100;return [mix(-4,5,a),mix(12,3.8,a),mix(3,-7,a)];},
  update(s,time){
   const a=s.amount/100;
   skyMat.color.set('#2e3566').lerp(new T.Color('#f3c49f'),a);skyMat.emissive.set('#20264f').lerp(new T.Color('#f0a978'),a);skyMat.emissiveIntensity=.35;
   moon.visible=a<.6;stars.forEach((st,i)=>st.visible=a<.42-(i%4)*.05);sun.position.y=mix(-.2,1.95,clamp01((a-.45)/.55));sun.visible=a>.45;sunGlow.position.y=sun.position.y;sunGlow.visible=sun.visible;
   waterTex.offset.x=-time*.12;
   // Train position: choreographed while playing, parked at the chosen stop otherwise.
   let u=[uPlat,uBake,uRiver][s.choice];
   if(s.playing){u=s.step===0?uPlat+ease(segment(s.progress,.05,.62))*.32:s.step===1?uPlat+.32+s.progress*.2:uRiver-.16+.16*ease(segment(s.progress,.2,.72));}
   placeOn(loco.g,u);placeOn(coach.g,u-1.02/len);
   [loco,coach].forEach(tr=>tr.wheels.forEach(w=>w.rotation.x=u*len/.075));
   const lit=s.alternate,night=1-a;
   const glass=(m:T.Mesh,on:boolean)=>{const mat=m.material as T.MeshStandardMaterial;mat.color.set(on?'#ffd27a':'#3a3d55');mat.emissive.set(on?'#f5a63a':'#000000');mat.emissiveIntensity=on?.9:0;};
   [...loco.windows,...coach.windows].forEach(w=>glass(w,lit||s.step===0));towerWindows.forEach((w,i)=>glass(w,lit&&i%3!==1));glass(houseWindow,lit);
   const bakeryOn=lit||s.step>=1||s.choice===1;bakeryWindows.forEach(w=>glass(w,bakeryOn));(bakeryPool.material as T.MeshBasicMaterial).opacity=bakeryOn?.5*mix(1,.4,a):0;(bakeryGlow.material as T.SpriteMaterial).opacity=bakeryOn?.6*night+.1:0;
   lamps.forEach(l=>{l.halo.visible=night>.25;(l.bulb.material as T.MeshStandardMaterial).emissiveIntensity=night;});(dawnLamp.material as T.MeshStandardMaterial).emissiveIntensity=night;
   steam.forEach((r,i)=>{const h=((time*.3+i*.55)%1.3);r.set(h,h-.5);});
   const mins=Math.round(mix(12,340,a)),hh=Math.floor(mins/60),mm=mins%60;clockCard.set([`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`]);
   hourHand.rotation.z=-(mins/720)*Math.PI*2;minuteHand.rotation.z=-(mm/60)*Math.PI*2;
   // The two strangers: platform, then the bakery, then the river.
   strangers.forEach((f,i)=>{const at=[starts[i],doorFront(i),benchFront(i)];
    if(!s.playing){const t=at[s.choice];f.root.position.set(...t);f.root.rotation.y=s.choice===0?Math.atan2(-pn.x,-pn.z)+(i?.5:-.5):i?-.6:.6;f.pose({shoulders:.05,elbows:.25,head:-.05});return;}
    if(s.step===0){f.root.position.set(...at[0]);f.root.rotation.y=Math.atan2(-pn.x,-pn.z)+(i?.4:-.4)+(s.progress>.34?(i?1.1:-1.1):0);f.pose({shoulders:.05,elbows:.25,head:s.progress>.34?-.05:.1});}
    else if(s.step===1)walkTo(f,at[0],at[1],segment(s.progress,.05+i*.04,.55+i*.04),true);
    else walkTo(f,at[1],at[2],segment(s.progress,.0+i*.04,.6+i*.04),true);});
   const e=ease(segment(s.progress,.1,.85));const talk=s.step===0?.05:s.step===1?mix(.05,.82,e):.82;
   rack.set([mix(.92,.08,a),talk,mix(.05,.95,a)],[`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`,`${Math.round(talk*240)} min`,`${Math.round(a*100)}%`]);
   const st=stationAt();rings.group.position.set(st[s.choice][0],st[s.choice][1]+.01,st[s.choice][2]);rings.update(time,1);
   labels.forEach((l,i)=>{l.mesh.visible=i===s.choice;l.mesh.position.set(st[i][0]+(i===2?-.2:0),i===1?1.75:1.65,st[i][2]+.35);});
   notes.forEach((n,i)=>{n.mesh.visible=s.alternate;n.mesh.position.set(st[i][0]+(i===2?-.6:.75),.6,st[i][2]+.55);});
  },
  camera(s){const t=s.progress,P=platform.position,cl:V3=[P.x+pn.x*.24,1.0,P.z+pn.z*.24],b=BAKERY,E=bp;
   if(s.step===0)return shotPath(t,[[0,shot([-.4,5.2,8.6],[-.6,.5,.2])],[.34,shot([P.x+pn.x*2.6+.6,1.1,P.z+pn.z*2.6],[P.x,.45,P.z])],[.67,shot([cl[0]+pn.x*1.3+.3,1.15,cl[2]+pn.z*1.3],cl)]]);
   if(s.step===1)return shotPath(t,[[0,shot([0,6.6,5.6],[-.4,.3,-.2])],[.34,shot([b[0]+1.0,1.0,b[2]+2.4],[b[0],.6,b[2]+.3])],[.67,shot([RACK[0]-.3,1.5,RACK[2]+2.2],[RACK[0],.85,RACK[2]])]]);
   return shotPath(t,[[0,shot([-.2,2.2,4.2],[.4,1.6,-3.1])],[.34,shot([E.x+1.3,1.1,E.z+2.2],[E.x,.3,E.z])],[.67,shot([.5,5.8,10.2],[0,.8,-.6])]]);
  }
 };
}
