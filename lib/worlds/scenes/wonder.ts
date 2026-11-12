import * as T from 'three';
import type {Concept} from '../concepts';
import {PAPER,box,cyl,sphere,extrude,group,tube,card,jarRack,ribbon,waves,glow,paper,hullMaterial,shot,shotPath,ease,segment,mix,clamp01,type Model,type V3} from '../kit';

// A Field Guide to Wonder: a cut-away planter. A seed splits, roots reach down the soil face,
// and a fern uncurls from a tight fiddlehead into a frond made of the same shape at every scale.
function leafShape(len:number,wid:number){const s=new T.Shape();s.moveTo(0,0);s.bezierCurveTo(wid,len*.25,wid*.7,len*.8,0,len);s.bezierCurveTo(-wid*.7,len*.8,-wid,len*.25,0,0);return s;}
function starShape(r:number,points:number){const s=new T.Shape();for(let i=0;i<=points*2;i++){const a=i/(points*2)*Math.PI*2,rr=i%2?r*.72:r;if(i)s.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);else s.moveTo(rr,0);}return s;}

type Frond={update:(g:number,time:number)=>void;group:T.Group};
function frond(parent:T.Object3D,x:number,z:number,ry:number,scale:number,delay:number):Frond{
 const g=group(parent,x,1.0,z);g.rotation.y=ry;g.scale.setScalar(scale);
 const N=64,R=10;const geo=new T.BufferGeometry();const pos=new Float32Array((N+1)*R*3),nor=new Float32Array((N+1)*R*3),idx:number[]=[];
 for(let i=0;i<N;i++)for(let j=0;j<R;j++){const a=i*R+j,b=i*R+(j+1)%R,c=(i+1)*R+j,d=(i+1)*R+(j+1)%R;idx.push(a,c,b,b,c,d);}
 geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('normal',new T.BufferAttribute(nor,3));geo.setIndex(idx);
 const stem=new T.Mesh(geo,paper('#9cc47f',{strength:.8}));stem.castShadow=true;stem.userData.keepColor=true;g.add(stem);const stemHull=new T.Mesh(geo,hullMaterial(.008));stemHull.raycast=()=>{};stem.add(stemHull);
 const PINNAE=12,PINNULES=7,count=PINNAE*2*PINNULES;const leafGeo=new T.ExtrudeGeometry(leafShape(1,.32),{depth:.01,bevelEnabled:false,curveSegments:10});
 const leaves=new T.InstancedMesh(leafGeo,paper('#c4e3a4',{strength:.7}),count);leaves.castShadow=true;leaves.userData.keepColor=true;g.add(leaves);
 const leafHull=new T.InstancedMesh(leafGeo,hullMaterial(.006),count);leafHull.raycast=()=>{};g.add(leafHull);
 const m=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),v=new T.Vector3(),sc=new T.Vector3();let built=-1;
 const update=(growth:number,time:number)=>{
  const gl=clamp01((growth-delay)/(1-delay));const key=Math.round(gl*400)+Math.round(time*20)*1000;if(key===built)return;built=key;
  const L=mix(.35,2.9,ease(gl)),curl=Math.pow(1-gl,1.35)*16,sway=Math.sin(time*.9+delay*9)*.04*gl;
  const pts:{x:number;y:number;a:number}[]=[];let px=0,py=0;
  for(let i=0;i<=N;i++){const u=i/N;const a=sway*u+curl*Math.pow(u,3.2)+(1-gl)*.25*u;pts.push({x:px,y:py,a});px+=Math.sin(a)*L/N;py+=Math.cos(a)*L/N;}
  for(let i=0;i<=N;i++){const {x,y,a}=pts[i];const r=mix(.05,.012,i/N)*(.6+.4*gl);const nx=Math.cos(a),ny=-Math.sin(a);for(let j=0;j<R;j++){const t=j/R*Math.PI*2,cs=Math.cos(t),sn=Math.sin(t);const k=(i*R+j)*3;nor[k]=nx*cs;nor[k+1]=ny*cs;nor[k+2]=sn;pos[k]=x+nx*cs*r;pos[k+1]=y+ny*cs*r;pos[k+2]=sn*r;}}
  geo.attributes.position.needsUpdate=true;geo.attributes.normal.needsUpdate=true;geo.computeBoundingSphere();
  let n=0;
  for(let k=0;k<PINNAE;k++){const u=.2+k/PINNAE*.76,i=Math.min(N,Math.round(u*N));const {x,y,a}=pts[i];const open=clamp01((gl-u*.55)/.42);const len=mix(.04,.78,ease(open))*(1.05-u*.75);
   for(const side of [-1,1]){const pa=a+side*mix(.35,1.05,open)+Math.sin(time*1.4+k)*.03*gl;
    for(let j=0;j<PINNULES;j++){const w=(j+1)/PINNULES;const along=w*len;const lx=x+Math.sin(pa)*along,ly=y+Math.cos(pa)*along;const leafA=pa+side*mix(.2,1.15,open)*(j%2?1:-1)*.7+side*.5;const size=mix(.02,.17,ease(open))*(1.1-w*.6)*(1.05-u*.5);
     e.set(0,0,-leafA);q.setFromEuler(e);v.set(lx,ly,(j%2?.006:-.006)+side*.004);sc.set(size,size,1);m.compose(v,q,sc);leaves.setMatrixAt(n,m);leafHull.setMatrixAt(n,m);n++;}}}
  leaves.instanceMatrix.needsUpdate=true;leafHull.instanceMatrix.needsUpdate=true;leaves.computeBoundingSphere();leafHull.computeBoundingSphere();
 };
 update(0,0);return {update,group:g};
}

export function buildWonder(p:T.Group,c:Concept):Model{
 const [teal,lime,amber]=c.colors;
 // Planter with an open front showing the soil in section.
 const planter=group(p,-.2,0,.3);
 box(planter,3.3,.08,1.7,PAPER,0,.04,0);box(planter,3.3,1.1,.08,PAPER,0,.55,-.81);for(const x of [-1.61,1.61])box(planter,.08,1.1,1.7,PAPER,x,.55,0);
 box(planter,3.14,.9,1.52,'#9a7a5c',0,.53,-.02,{strength:.7});
 const strata=document.createElement('canvas');strata.width=512;strata.height=150;const sx=strata.getContext('2d')!;sx.fillStyle='#b08d6c';sx.fillRect(0,0,512,150);for(let i=0;i<26;i++){sx.strokeStyle=`rgba(60,40,25,${.15+(i%5)*.06})`;sx.lineWidth=1+(i%3);sx.beginPath();const y=12+i*5.4;sx.moveTo(0,y);for(let x=0;x<=512;x+=32)sx.lineTo(x,y+Math.sin(x*.05+i)*3);sx.stroke();}for(let i=0;i<70;i++){sx.fillStyle=`rgba(${120+(i*7)%80},${100+(i*5)%60},80,.8)`;sx.beginPath();sx.ellipse?.((i*73)%512,(i*41)%150,3+(i%4)*2,2+(i%3)*2,0,0,Math.PI*2);sx.fill();}
 const strataTex=new T.CanvasTexture(strata as HTMLCanvasElement);strataTex.colorSpace=T.SRGBColorSpace;
 const face=new T.Mesh(new T.PlaneGeometry(3.14,.9),new T.MeshStandardMaterial({map:strataTex,roughness:1}));face.position.set(0,.53,.745);face.userData.keepColor=true;face.receiveShadow=true;planter.add(face);
 const roots=[[[0,.98,.76],[.05,.7,.76],[-.12,.42,.76],[.04,.14,.76]],[[0,.95,.76],[-.3,.75,.76],[-.62,.5,.76],[-.8,.28,.76]],[[0,.95,.76],[.32,.78,.76],[.6,.56,.76],[.95,.36,.76]],[[-.35,.72,.76],[-.42,.48,.76],[-.3,.24,.76]],[[.4,.72,.76],[.52,.5,.76],[.42,.2,.76]]].map((pts,i)=>{const r=tube(planter,pts as V3[],i<3?.011:.007,'#ead6b4',{hull:.004,shadow:false});return r;});
 // The seed: two halves that part as the first shoot appears.
 const seed=group(p,-.2,1.0,.3,0);const halves=[0,1].map(i=>{const h=new T.Mesh(new T.SphereGeometry(.16,24,16,i*Math.PI,Math.PI),paper('#d4a066',{strength:.8}));h.scale.set(1,.72,.75);h.castShadow=true;h.userData.keepColor=true;h.add(Object.assign(new T.Mesh(h.geometry,hullMaterial(.008)),{raycast:()=>{}}));seed.add(h);return h;});
 // Three fronds; the hero frond faces the reader.
 const stemGroup=group(p,0,0,0,1);const leafGroup=group(p,0,0,0,2);
 const fronds=[frond(stemGroup,-.2,.32,0,1,0),frond(leafGroup,-.45,.1,.85,.72,.12),frond(leafGroup,.1,.12,-.95,.66,.2)];
 // Sun on a pop-up stick, and a paper cloud that rains into the planter.
 const sunStick=group(p,1.65,0,-1.25);cyl(sunStick,.025,.025,3.7,PAPER,0,1.85,0,{hull:.006});
 const sun=group(sunStick,0,3.85,.05);extrude(sun,starShape(.46,12),.05,'#f6cf63',0,0,0,{emissive:'#f2b53c',emissiveIntensity:.25});const sunHalo=glow(sun,'#ffc24a',2.4,0,0,.1,.55);
 const cloud=group(p,-1.3,0,-.95);cyl(cloud,.02,.02,3.2,PAPER,.25,1.6,0,{hull:.006});const puff=group(cloud,0,3.25,0);[[0,0,.32],[.32,.06,.26],[-.3,.02,.24],[.12,.22,.26],[-.14,.16,.22]].forEach(([x,y,r])=>sphere(puff,r,'#eef4fb',x,y,0,{hull:.01}));
 const drops=Array.from({length:10},(_,i)=>{const d=sphere(cloud,.03,'#7fb7e6',-.4+(i%5)*.2,3.0,(i%2?.15:-.1),{outline:'none',shadow:false});d.scale.y=1.8;d.userData.keepColor=true;return d;});
 const rack=jarRack(p,c.stores.map((label,i)=>({label,color:['#f2c14e','#5aa6e6',teal][i]})),{x:1.85,z:-2.45,ry:-.3,spacing:.72,r:.23,h:.72});
 const sunFlow=ribbon(p,[[1.55,3.75,-1.15],[1.0,3.6,-.6],[.35,3.0,0],[-.15,2.2,.3]],amber,{width:.1,twist:2});
 const rainFlow=ribbon(p,[[-1.3,3.0,-.9],[-1.0,2.0,-.4],[-.6,1.25,0],[-.25,.95,.3]],'#5aa6e6',{width:.08,twist:2});
 const transfer=ribbon(rack.group,[[-.72,1.38,0],[-.4,1.95,.12],[.4,1.95,.12],[.72,1.38,0]],lime,{width:.09,twist:1.5});
 const flyWing=new T.Shape();flyWing.moveTo(0,0);flyWing.bezierCurveTo(.18,.04,.24,.2,.12,.22);flyWing.bezierCurveTo(.05,.22,.02,.1,0,0);
 const butterfly=group(p);const wings=[1,-1].map(sd=>{const w=group(butterfly);extrude(w,flyWing,.006,'#f08a5d',0,0,0,{emissive:'#f08a5d',emissiveIntensity:.15}).scale.x=sd;return w;});
 const rings=waves(p,c.accent,{rx:-Math.PI/2,count:3,size:.75});
 const labels=['THE SEED','THE STEM','THE LEAVES'].map((t,i)=>card(p,[t],{w:.8,h:.3,x:[1.05,-1.35,.95][i],y:[1.35,2.0,3.4][i],z:[.55,.7,.5][i],ry:[-.2,.25,-.2][i],rx:-.12}));
 const notes=[['root hairs','drink first'],['fiddlehead','a coiled spring'],['pinnules','leaves of leaves']].map((l,i)=>card(p,l,{w:1.2,h:.62,x:[1.0,-1.6,.95][i],y:[.7,2.7,2.6][i],z:[1.3,.6,.9][i],ry:[-.2,.3,-.25][i],accent:c.colors[i]}));
 const levelsFor=(step:number,t:number)=>{const e=ease(t);return step===0?[.2+.6*e,.55,.03]:step===1?[.8-.35*e,.55-.32*e,.03+.42*e]:[.45-.3*e,.23,.45+.48*e];};
 return {
  update(s,time){
   const g=s.amount/100;
   fronds.forEach(f=>f.update(g,time));
   halves.forEach((h,i)=>{h.rotation.z=(i?1:-1)*mix(0,.9,clamp01(g*6));h.position.x=(i?1:-1)*mix(0,.09,clamp01(g*6));});seed.scale.setScalar(mix(1,.85,clamp01(g*2)));
   roots.forEach((r,i)=>{const grow=clamp01((g*1.6+(s.step===0?segment(s.progress,.2,.8)*.5:.5))-(i>2?.6:.1));r.geometry.setDrawRange(0,Math.floor(grow*120)*60);r.visible=grow>.01;});
   sun.rotation.z=time*.12;sunHalo.visible=s.alternate||s.step===1;(sunHalo.material as T.SpriteMaterial).opacity=s.alternate?.75:.4;
   const raining=s.step===1?1:s.alternate?.4:0;drops.forEach((d,i)=>{const f=((time*.55+i*.137)%1+1)%1;d.position.y=mix(3.05,1.3,f);d.visible=raining>0&&(i/drops.length)<raining+.05;});
   const lv=levelsFor(s.step,segment(s.progress,.1,.85));rack.set(lv,lv.map(v=>`${Math.round(v*96)} J`));
   sunFlow.set(s.step===1||s.alternate?segment(s.progress,.05,.5)+(s.alternate&&s.step!==1?1:0):0,s.step===1?segment(s.progress,.35,.95):0);
   rainFlow.set(s.step===1?segment(s.progress,.1,.55):0,s.step===1?segment(s.progress,.4,.95):0);
   transfer.set(s.step===2?segment(s.progress,.15,.6):0,s.step===2?segment(s.progress,.45,.95):0);
   const bt=time*.55;butterfly.position.set(-.2+Math.sin(bt)*1.15,2.4+Math.sin(bt*1.7)*.45+g*.6,.35+Math.cos(bt)*.8);butterfly.rotation.y=-bt+Math.PI/2;wings.forEach((w,i)=>w.rotation.y=(i?-1:1)*(.25+Math.abs(Math.sin(time*11))*1.1));butterfly.visible=g>.25;
   const at=[[-.2,1.02,.3],[-.2,1.02,.3],[-.2,mix(1.2,2.6,g),.3]][s.choice];rings.group.position.set(at[0],at[1],at[2]);rings.update(time,1);
   labels.forEach((l,i)=>l.mesh.visible=i===s.choice);notes.forEach(n=>n.mesh.visible=s.alternate);
  },
  camera(s){const t=s.progress;const top=mix(1.6,3.6,s.amount/100);
   if(s.step===0)return shotPath(t,[[0,shot([.5,4.6,9.4],[-.1,1.5,-.2])],[.35,shot([.2,1.4,3.7],[-.2,.8,.5])],[.72,shot([.6,2.5,2.4],[1.85,.9,-2.3])]]);
   if(s.step===1)return shotPath(t,[[0,shot([-2.8,3.3,6.6],[-.2,1.9,.2])],[.4,shot([.7,top*.8+.5,3.3],[-.2,top*.8,.3])],[.75,shot([1.2,2.6,2.2],[1.85,.95,-2.4])]]);
   return shotPath(t,[[0,shot([0,3.4,6.8],[-.2,2.5,.2])],[.4,shot([.5,3.1,2.5],[-.15,3.0,.3])],[.78,shot([.6,6.2,10.6],[0,1.7,-.4])]]);
  }
 };
}
