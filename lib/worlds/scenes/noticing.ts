import * as T from 'three';
import type {Concept} from '../concepts';
import {PAPER,box,cyl,lathe,extrude,group,tube,card,jarRack,ribbon,waves,glow,setTint,shot,shotPath,ease,easeOut,segment,mix,clamp01,type Model,type V3} from '../kit';

// The Art of Noticing: a paper room. Real sunlight falls through a cut-out window; moving the
// light changes the room. Attention flows between three jars: glanced, noticed, remembered.
function leafShape(len:number,wid:number){const s=new T.Shape();s.moveTo(0,0);s.bezierCurveTo(wid*.95,len*.18,wid*.75,len*.78,0,len);s.bezierCurveTo(-wid*.75,len*.78,-wid*.95,len*.18,0,0);return s;}

export function buildNoticing(p:T.Group,c:Concept):Model{
 const [blue]=c.colors;
 // Room shell: floor, a back wall with a window opening, and a side wall.
 box(p,5.5,.05,4.5,PAPER,0,.025,-.6);
 const wallShape=new T.Shape();wallShape.moveTo(-2.75,0);wallShape.lineTo(2.75,0);wallShape.lineTo(2.75,3.1);wallShape.lineTo(-2.75,3.1);wallShape.lineTo(-2.75,0);
 const hole=new T.Path();hole.moveTo(-1.35,1.15);hole.lineTo(.55,1.15);hole.lineTo(.55,2.75);hole.lineTo(-1.35,2.75);hole.lineTo(-1.35,1.15);wallShape.holes.push(hole);
 const wall=group(p,0,0,-2.85);extrude(wall,wallShape,.1,'#f4eee2');
 const window=group(p,0,0,-2.85,1);box(window,.05,1.6,.07,PAPER,-.4,1.95,0);box(window,1.9,.05,.07,PAPER,-.4,1.95,0);box(window,2.2,.08,.34,PAPER,-.4,1.11,.12);
 const skyCanvas=document.createElement('canvas');skyCanvas.width=64;skyCanvas.height=128;const sctx=skyCanvas.getContext('2d')!;const sg=sctx.createLinearGradient?.(0,0,0,128);if(sg){sg.addColorStop(0,'#9cc4e8');sg.addColorStop(1,'#fbe3b8');sctx.fillStyle=sg;sctx.fillRect(0,0,64,128);}
 const skyTex=new T.CanvasTexture(skyCanvas as HTMLCanvasElement);skyTex.colorSpace=T.SRGBColorSpace;
 const sky=new T.Mesh(new T.PlaneGeometry(2.4,2),new T.MeshBasicMaterial({map:skyTex,color:'#ffffff'}));sky.position.set(-.4,1.95,-.35);sky.userData.keepColor=true;window.add(sky);
 const sun=new T.Mesh(new T.SphereGeometry(.2,24,16),new T.MeshBasicMaterial({color:'#ffcf6e'}));sun.position.z=-.3;sun.userData.keepColor=true;window.add(sun);const sunGlow=glow(window,'#ffb24a',1.1,0,0,-.28,.8);
 box(p,.1,3.1,2.6,'#f1ebdf',-2.7,1.55,-1.6);
 // A small round table with the blue cup and saucer.
 const table=group(p,-.6,0,-.7);cyl(table,.95,.95,.07,PAPER,0,1.0,0,{hull:.012});lathe(table,[[.07,0],[.07,.96]],PAPER);cyl(table,.42,.48,.05,PAPER,0,.05,0);
 const cup=group(table,.25,1.035,.18,0);
 lathe(cup,[[0,0],[.24,0],[.3,.028],[.31,.04],[.29,.04],[.22,.016],[0,.016]],PAPER);
 lathe(cup,[[0,.02],[.12,.02],[.15,.045],[.175,.15],[.195,.27],[.2,.29],[.183,.29],[.165,.15],[.14,.065],[0,.065]],blue,0,0,0,{strength:.75});
 const handle=new T.Mesh(new T.TorusGeometry(.075,.02,8,20,Math.PI),new T.MeshStandardMaterial({color:blue,roughness:.6}));handle.position.set(.19,.17,0);handle.rotation.z=-Math.PI/2;handle.userData.keepColor=true;cup.add(handle);
 const coffee=new T.Mesh(new T.CircleGeometry(.17,28),new T.MeshStandardMaterial({color:'#5b3a26',roughness:.3}));coffee.rotation.x=-Math.PI/2;coffee.position.y=.25;coffee.userData.keepColor=true;cup.add(coffee);
 const steam=[0,1].map(i=>ribbon(p,[[-.35+i*.06,1.36,-.52],[-.26+i*.05,1.7,-.45],[-.42,2.05,-.55+i*.05],[-.28,2.4,-.5],[-.38,2.75,-.48]],'#f3a670',{width:.06,twist:2.5}));
 // A potted plant in the front corner; one leaf is the one we study under the lens.
 const plant=group(p,-1.95,0,.85,2);
 lathe(plant,[[0,0],[.22,0],[.3,.42],[.33,.45],[.33,.5],[.28,.5],[.27,.46],[0,.46]],'#eaa98c',0,0,0,{strength:.8});
 const leaves:T.Object3D[]=[];
 [[0,.9,.35,.25],[1.3,1.0,.3,.42],[2.6,.85,.28,.1],[3.7,1.15,.33,.5],[4.8,.95,.3,.3],[5.7,1.2,.36,.6]].forEach(([a,len,wid,tilt],i)=>{const g=group(plant,0,.46,0);g.rotation.y=a;const stem=tube(g,[[0,0,0],[0,len*.35,.05],[0,len*.6,.18]],.012,'#7aa66b',{shadow:false});stem.castShadow=false;const holder=group(g,0,len*.6,.18);holder.rotation.x=.9-tilt;extrude(holder,leafShape(len*.75,wid),.012,'#cfe3c6',0,0,0,{strength:.8});leaves.push(holder);if(i===5)holder.userData.hero=true;});
 const hero=leaves[5];const veins=group(hero);for(let i=0;i<5;i++){const y=.12+i*.12;tube(veins,[[0,y,.024],[(i%2?1:-1)*.13,y+.12,.024]],.005,'#4f7a52',{outline:'none',shadow:false});}tube(veins,[[0,0,.024],[0,.62,.024]],.007,'#4f7a52',{outline:'none',shadow:false});
 // The magnifying lens that travels to whatever we are paying attention to.
 const lens=group(p);const ring=new T.Mesh(new T.TorusGeometry(.32,.035,10,48),new T.MeshStandardMaterial({color:'#c9a45c',roughness:.4,metalness:.3}));ring.userData.keepColor=true;lens.add(ring);
 const lensGlass=new T.Mesh(new T.CircleGeometry(.31,40),new T.MeshStandardMaterial({color:'#dff1ff',transparent:true,opacity:.22,roughness:.05}));lensGlass.userData.keepColor=true;lens.add(lensGlass);
 cyl(lens,.03,.035,.55,'#7a5236',0,-.6,0,{hull:.008});
 const lensTargets:V3[]=[[-.1,1.62,-.2],[-.4,2.05,-2.25],[-1.95,1.55,1.35]];
 // Attention stores, connected by flowing ribbons.
 const rack=jarRack(p,c.stores.map((label,i)=>({label,color:c.colors[i]})),{x:1.75,z:-1.25,ry:-.45});
 const toRack=(x:number,y:number):V3=>{const a=-.45;return [1.75+x*Math.cos(a),y,-1.25-x*Math.sin(a)];};
 const glanceFlow=ribbon(p,[[-.33,1.4,-.5],[.15,2.4,-.9],[.75,2.25,-1.4],toRack(-.82,1.6)],blue,{width:.09,twist:2});
 const flows=[0,1].map(i=>ribbon(rack.group,[[(i-1)*.82,1.48,0],[(i-1)*.82+.22,2.05,.12],[i*.82-.22,2.05,.12],[i*.82,1.48,0]],c.colors[i+1],{width:.09,twist:1.5}));
 const rings=waves(p,c.accent,{rx:-Math.PI/2,count:3,size:.9});
 const labels=['THE CUP','THE LIGHT','THE LEAF'].map((t,i)=>card(p,[t],{w:1.05,h:.4,x:[-.3,-.4,-1.95][i],y:[2.0,3.05,2.15][i],z:[-.1,-2.2,1.3][i],rx:-.15}));
 const details=[['glaze','a hairline crack'],['4:10 pm','light moves 1° in 4 min'],['new leaf','still unfolding']].map((lines,i)=>card(p,lines,{w:1.2,h:.62,x:[.75,.9,-.75][i],y:[1.75,3.0,1.0][i],z:[.35,-2.3,1.85][i],ry:[-.25,0,.35][i],rx:-.1,accent:c.colors[i]}));
 const motes=new T.Points(new T.BufferGeometry(),new T.PointsMaterial({color:'#ffe7b3',size:.035,transparent:true,opacity:.85,depthWrite:false,blending:T.AdditiveBlending}));const moteSeeds=Array.from({length:44},(_,i)=>[(i*.618)%1,(i*.377)%1,(i*.733)%1]);motes.geometry.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(moteSeeds.length*3),3));motes.userData.keepColor=true;motes.raycast=()=>{};p.add(motes);
 const beamGeo=new T.BufferGeometry();beamGeo.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(24),3));beamGeo.setAttribute('color',new T.Float32BufferAttribute([1,.86,.6,1,.86,.6,1,.86,.6,1,.86,.6,.25,.18,.08,.25,.18,.08,.25,.18,.08,.25,.18,.08],3));beamGeo.setIndex([0,1,5,0,5,4,1,2,6,1,6,5,2,3,7,2,7,6,3,0,4,3,4,7]);
 const beam=new T.Mesh(beamGeo,new T.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.2,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}));beam.userData.keepColor=true;beam.raycast=()=>{};p.add(beam);
 const corners:V3[]=[[-1.35,1.15,-2.78],[.55,1.15,-2.78],[.55,2.75,-2.78],[-1.35,2.75,-2.78]];
 const sunAt=(a:number):V3=>[mix(-5.5,4.5,a),mix(6.6,4.4,a),-9];
 const levelsFor=(step:number,t:number)=>{const e=ease(t);return step===0?[.12+.7*e,.04,.02]:step===1?[.82-.5*e,.04+.62*e,.04]:[.32,.66-.34*e,.04+.74*e];};
 return {
  sun:s=>sunAt(s.amount/100),
  update(s,time){
   const a=s.amount/100,sunPos=sunAt(a),dir=new T.Vector3(...sunPos).multiplyScalar(-1).normalize();
   sun.position.set(mix(-1.1,.4,a),mix(2.45,1.55,a),-.3);sunGlow.position.copy(sun.position);
   const pos=beamGeo.attributes.position as T.BufferAttribute;corners.forEach((cr,i)=>{const t=(cr[1]-.05)/-dir.y;pos.setXYZ(i,...cr);pos.setXYZ(i+4,cr[0]+dir.x*t,.06,cr[2]+dir.z*t);});pos.needsUpdate=true;beamGeo.computeBoundingSphere();
   const mp=motes.geometry.attributes.position as T.BufferAttribute;moteSeeds.forEach(([u,v,w],i)=>{const f=((u+time*.018)%1+1)%1;const base=new T.Vector3(mix(-1.3,.5,v),mix(1.2,2.7,w),-2.75);const t=(base.y-.05)/-dir.y*f;mp.setXYZ(i,base.x+dir.x*t+Math.sin(time*.6+i)*.04,base.y+dir.y*t+Math.sin(time*.4+i*2)*.03,base.z+dir.z*t);});mp.needsUpdate=true;
   steam.forEach((r,i)=>{const h=((time*.32+i*.5)%1.25);r.set(h,h-.5);});
   const target=lensTargets[s.choice];const from=lensTargets[(s.choice+2)%3];const travel=s.playing?easeOut(segment(s.progress,.12,.42)):1;
   lens.position.set(mix(from[0],target[0],travel),mix(from[1],target[1],travel)+Math.sin(time*1.3)*.03,mix(from[2],target[2],travel));lens.rotation.set(-.25,s.choice===2?.6:0,Math.sin(time*.7)*.06);
   setTint(window,c.colors[1],s.choice===1?.25:0);
   const base=[[-.35,1.075,-.52],[-.4,1.2,-2.4],[-1.95,.05,.85]][s.choice];rings.group.position.set(base[0],base[1]+.01,base[2]);rings.update(time,1);
   labels.forEach((l,i)=>l.mesh.visible=i===s.choice);details.forEach(d=>d.mesh.visible=s.alternate);veins.visible=s.choice===2||s.alternate;hero.scale.setScalar(s.choice===2?1.18:1);
   const lv=levelsFor(s.step,segment(s.progress,.1,.85));rack.set(lv,lv.map(v=>String(Math.round(v*48))));
   glanceFlow.set(s.step===0?segment(s.progress,.2,.6):0,s.step===0?segment(s.progress,.45,.9):0);
   flows.forEach((f,i)=>{const on=s.step===i+1;const h=on?segment(s.progress,.15,.6):0;f.set(h,on?segment(s.progress,.4,.9):0);});
   leaves.forEach((l,i)=>l.rotation.z=Math.sin(time*.8+i)*.035*clamp01(a+.3));
  },
  camera(s){const t=s.progress;
   if(s.step===0)return shotPath(t,[[0,shot([.6,5.6,10],[-.2,1.1,-.8])],[.38,shot([-.5,2.5,3.2],[-.4,1.2,-.5])],[.72,shot([.5,2.6,2.9],[1.3,1.1,-1.5])]]);
   if(s.step===1)return shotPath(t,[[0,shot([-3.6,4.4,7.6],[-.3,1.2,-1.2])],[.4,shot([-1.1,1.55,2.4],[-.4,1.5,-2.4])],[.75,shot([1.2,2.6,2.6],[1.6,1.1,-1.4])]]);
   return shotPath(t,[[0,shot([.8,2.6,4.6],[-1.6,1.2,.6])],[.4,shot([-1.1,1.75,3.1],[-1.9,1.45,1.1])],[.78,shot([.4,6,10],[0,1.1,-.7])]]);
  }
 };
}
