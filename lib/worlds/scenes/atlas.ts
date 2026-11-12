import * as T from 'three';
import type {Concept} from '../concepts';
import {PAPER,box,cyl,sphere,extrude,group,tube,card,jarRack,ribbon,waves,mannequin,shot,shotPath,ease,segment,clamp01,type Model,type V3} from '../kit';

// Wild Atlas: a paper relief map. Stacked contour layers make a ridge and a hill, a river runs
// through the low ground, and a small traveller walks the chosen path, counting steps.
type Bump={cx:number;cz:number;rx:number;rz:number;K:number;seed:number};
const BASE=.1,DH=.17;
const bumps:Bump[]=[{cx:1.3,cz:-1.75,rx:1.45,rz:.92,K:11,seed:1.3},{cx:-1.75,cz:-2.05,rx:.98,rz:.72,K:6,seed:4.1}];
const radiusAt=(b:Bump,k:number,th:number)=>Math.pow(1-(k-1)/b.K,.75)*(1+.1*Math.sin(3*th+b.seed+k*.7)+.05*Math.sin(5*th+k*1.3+b.seed));
const inside=(b:Bump,k:number,x:number,z:number)=>{const nx=(x-b.cx)/b.rx,nz=(z-b.cz)/b.rz;return Math.hypot(nx,nz)<radiusAt(b,k,Math.atan2(nz,nx));};
const BRIDGE={x:1.15,z:.48,dx:.25/Math.hypot(.25,1.3),dz:-1.3/Math.hypot(.25,1.3)};
function heightAt(x:number,z:number){
 let top=BASE;
 for(const b of bumps)for(let k=b.K;k>=1;k--)if(inside(b,k,x,z)){top=Math.max(top,BASE+k*DH);break;}
 const rx=x-BRIDGE.x,rz=z-BRIDGE.z,along=rx*BRIDGE.dx+rz*BRIDGE.dz,across=Math.abs(-rx*BRIDGE.dz+rz*BRIDGE.dx);
 if(Math.abs(along)<.46&&across<.2){const t=(along+.46)/.92;top=Math.max(top,BASE+.84*t*(1-t));}
 return top;
}
const RIVER:[number,number][]=[[-2.85,-.75],[-2.0,-.55],[-1.2,-.3],[-.4,.1],[.4,.15],[1.2,.5],[1.9,.95],[2.85,1.45]];
const PATHS:[number,number][][]=[
 [[.35,2.2],[-.05,1.55],[-.55,.95],[-1.2,.42],[-1.95,.2],[-2.65,-.12]],
 [[.35,2.2],[-.3,2.05],[-1.0,1.85],[-1.7,1.55],[-2.25,1.15],[-1.9,.85],[-1.25,1.05]],
 [[.35,2.2],[.85,1.55],[1.1,.85],[1.15,.48],[1.35,-.45],[.75,-1.0],[1.15,-1.35],[1.55,-1.55],[1.3,-1.75]]];
function layerShape(b:Bump,k:number){const s=new T.Shape(),n=64;for(let i=0;i<=n;i++){const th=i/n*Math.PI*2,r=radiusAt(b,k,th);const x=b.cx+b.rx*r*Math.cos(th),z=b.cz+b.rz*r*Math.sin(th);if(i)s.lineTo(x,-z);else s.moveTo(x,-z);}return s;}
function slab(){const s=new T.Shape();const [x0,x1,z0,z1,r]=[-3,3,-3.1,2.45,.3];s.moveTo(x0+r,-z0);s.lineTo(x1-r,-z0);s.quadraticCurveTo(x1,-z0,x1,-z0-r);s.lineTo(x1,-z1+r);s.quadraticCurveTo(x1,-z1,x1-r,-z1);s.lineTo(x0+r,-z1);s.quadraticCurveTo(x0,-z1,x0,-z1+r);s.lineTo(x0,-z0-r);s.quadraticCurveTo(x0,-z0,x0+r,-z0);return s;}

const SUMMER=['#cfe2c4','#d8e8c2','#c7dcc4'],AUTUMN=['#e8a24a','#d9704b','#dcb84a','#c8603e'];
function tree(p:T.Object3D,x:number,z:number,size:number,kind:number,crowns:T.Mesh[]){
 const g=group(p,x,heightAt(x,z),z);g.scale.setScalar(size);cyl(g,.035,.05,.32,'#efe4d0',0,.16,0,{hull:.006});
 if(kind%2===0){[[.34,.42,.26],[.27,.36,.5],[.19,.3,.72]].forEach(([r,h,y])=>crowns.push(cyl(g,0,r,h,SUMMER[0],0,y+h/2,0,{hull:.008})));}
 else{const c=sphere(g,.3,SUMMER[1],0,.58,0,{hull:.008});c.scale.set(1,1.12,1);crowns.push(c);const c2=sphere(g,.2,SUMMER[2],.16,.74,.05,{hull:.008});crowns.push(c2);}
 return g;
}

export function buildAtlas(p:T.Group,c:Concept):Model{
 const [riverC,woodC,ridgeC]=c.colors;
 const base=extrude(p,slab(),.1,PAPER,0,.05,0);base.rotation.x=-Math.PI/2;
 // Contour layers: the ridge (choice 2) and a quieter hill.
 const ridge=group(p,0,0,0,2);const hill=group(p);
 bumps.forEach((b,bi)=>{for(let k=1;k<=b.K;k++){const m=extrude(bi?hill:ridge,layerShape(b,k),DH,k===b.K?'#f1ead9':PAPER,0,BASE+(k-.5)*DH,0,{strength:.85});m.rotation.x=-Math.PI/2;}});
 const summit:V3=[bumps[0].cx,heightAt(bumps[0].cx,bumps[0].cz),bumps[0].cz];
 [[.16,.07],[.12,.06],[.085,.05],[.055,.04]].reduce((y,[r,h])=>{const st=sphere(ridge,r,'#e8e1d2',summit[0],y+h/2,summit[2],{hull:.006});st.scale.y=h/r;return y+h*.9;},summit[1]);
 cyl(ridge,.012,.012,.55,PAPER,summit[0]+.05,summit[1]+.5,summit[2],{hull:.004});
 const flagShape=new T.Shape();flagShape.moveTo(0,0);flagShape.lineTo(.26,-.07);flagShape.lineTo(0,-.15);flagShape.lineTo(0,0);
 const flag=group(ridge,summit[0]+.05,summit[1]+.76,summit[2]);extrude(flag,flagShape,.01,ridgeC,0,0,0,{emissive:ridgeC,emissiveIntensity:.15}).userData.keepColor=true;
 // River in the low ground, with a current flowing along it.
 const river=group(p,0,0,0,0);const water=tube(river,RIVER.map(([x,z])=>[x,0,z] as V3),.17,'#9cc9e6',{hull:.006,shadow:false});water.position.y=BASE+.012;water.scale.y=.14;water.userData.keepColor=true;
 const currents=[0,1].map(i=>ribbon(river,RIVER.map(([x,z],k)=>[x+(i?.05:-.05),BASE+.04,z+(k%2?.03:-.03)*(i?1:-1)] as V3),i?'#3f8fd0':'#6fb3e3',{width:.05,twist:0}));
 // A small arched footbridge where the ridge path crosses.
 const deck=new T.Shape();deck.moveTo(-.46,0);deck.quadraticCurveTo(0,.42,.46,0);deck.lineTo(.36,0);deck.quadraticCurveTo(0,.29,-.36,0);deck.lineTo(-.46,0);
 const bridge=group(p,BRIDGE.x,BASE,BRIDGE.z);bridge.rotation.y=Math.atan2(-BRIDGE.dz,BRIDGE.dx);extrude(bridge,deck,.32,'#efe5d2');
 for(const side of [-1,1])tube(bridge,Array.from({length:7},(_,i)=>{const t=i/6,x=-.46+.92*t;return [x,.84*t*(1-t)+.14,side*.15] as V3;}),.012,PAPER,{hull:.004});
 // Woodland (choice 1), and a few trees on the hill.
 const woods=group(p,0,0,0,1);const crowns:T.Mesh[]=[];
 [[-2.55,.85,.95],[-2.3,1.45,.82],[-1.8,.62,.9],[-1.55,1.25,1.0],[-1.05,1.4,.85],[-.75,.75,.78],[-2.75,1.3,.72],[-.45,1.6,.7]].forEach(([x,z,s],i)=>tree(woods,x,z,s,i,crowns));
 [[-2.1,-1.7,.7],[-1.4,-2.35,.6],[-2.45,-2.3,.62],[2.4,-.6,.6]].forEach(([x,z,s],i)=>tree(hill,x,z,s,i+1,crowns));
 // Trailhead signpost pointing to the three routes.
 const post=group(p,.35,BASE,2.2);cyl(post,.025,.03,.72,'#efe4d0',0,.36,0,{hull:.006});
 PATHS.forEach((path,i)=>{const [x,z]=path[1],a=Math.atan2(-(z-2.2),x-.35);const arm=group(post,0,.66-i*.1,0);arm.rotation.y=a;box(arm,.36,.07,.025,[riverC,woodC,ridgeC][i],.2,0,0,{threshold:20}).userData.keepColor=true;});
 // Paths as dotted trails that step up and down the contour layers.
 const curves=PATHS.map(pts=>new T.CatmullRomCurve3(pts.map(([x,z])=>new T.Vector3(x,0,z)),false,'catmullrom',.5));
 const lengths=curves.map(cv=>cv.getLength());
 const DOTS=48,dotGeo=new T.SphereGeometry(.034,10,8);
 const dots=curves.map(cv=>{const m=new T.InstancedMesh(dotGeo,new T.MeshStandardMaterial({color:'#ffffff',roughness:.6}),DOTS);m.userData.keepColor=true;m.castShadow=false;m.raycast=()=>{};const mtx=new T.Matrix4();for(let i=0;i<DOTS;i++){const pt=cv.getPointAt(i/(DOTS-1));mtx.makeTranslation(pt.x,heightAt(pt.x,pt.z)+.03,pt.z);m.setMatrixAt(i,mtx);m.setColorAt(i,new T.Color('#b9b1a1'));}p.add(m);return m;});
 const trails=curves.map((cv,i)=>ribbon(p,Array.from({length:28},(_,k)=>{const pt=cv.getPointAt(k/27);return [pt.x,heightAt(pt.x,pt.z)+.22,pt.z] as V3;}),[riverC,woodC,ridgeC][i],{width:.07,twist:1}));
 // The traveller, the step counter and the stores.
 const walker=mannequin(p,PAPER,.55);const rings=waves(p,c.accent,{rx:-Math.PI/2,count:3,size:.5});
 const counter=card(p,['0','steps taken'],{w:.95,h:.6,x:1.55,y:BASE+.3,z:2.0,ry:-.35,rx:-.08});
 const labels=['THE RIVER','THE WOODLAND','THE RIDGE'].map((t,i)=>card(p,[t],{w:1.05,h:.38,x:[-.55,-1.6,1.3][i],y:[.62,1.62,2.55][i],z:[.42,1.15,-1.5][i],rx:-.15,accent:c.colors[i]}));
 const notes=[['willow & sedge','the low ground'],['oak & beech','dappled light'],['scree & thyme','a wide view']].map((l,i)=>card(p,l,{w:1.2,h:.6,x:[.55,-2.2,2.3][i],y:[.62,1.15,1.95][i],z:[.7,.15,-.75][i],ry:[0,.3,-.4][i],accent:c.colors[i]}));
 const rack=jarRack(p,c.stores.map((label,i)=>({label,color:c.colors[i]})),{x:2.15,z:-2.7,ry:-.35,spacing:.6,r:.2,h:.66});
 rack.group.position.y=BASE;
 const levelsFor=(step:number,t:number)=>{const e=ease(t);return step===0?[.1+.4*e,.05,.05]:step===1?[.5,.05+.55*e,.05]:[.5,.6,.05+.8*e];};
 const walked=new T.Color(),ahead=new T.Color(),grey=new T.Color('#b9b1a1');
 return {
  update(s,time){
   const sel=s.choice,curve=curves[sel];
   const u=clamp01(s.amount/100+(s.step===0?segment(s.progress,.67,1)*.1:0));
   const pt=curve.getPointAt(u),tan=curve.getTangentAt(u);
   walker.root.position.set(pt.x,heightAt(pt.x,pt.z),pt.z);walker.root.rotation.y=Math.atan2(tan.x,tan.z);
   if(s.playing)walker.walk(time*7.5,1);else walker.pose({head:.1});
   rings.group.position.set(pt.x,heightAt(pt.x,pt.z)+.012,pt.z);rings.update(time,1);
   const steps=Math.round(u*lengths[sel]*1350);counter.set([steps.toLocaleString('en-GB'),'steps taken']);
   walked.set([riverC,woodC,ridgeC][sel]);ahead.copy(walked).lerp(new T.Color('#ffffff'),.55);
   dots.forEach((m,i)=>{const on=i===sel;for(let k=0;k<DOTS;k++)m.setColorAt(k,on?(k/(DOTS-1)<=u?walked:ahead):grey);if(m.instanceColor)m.instanceColor.needsUpdate=true;});
   trails.forEach((r,i)=>r.set(i===sel?u:0,0));
   currents.forEach((r,i)=>{const h=((time*.16+i*.55)%1.45);r.set(h,h-.45);});
   crowns.forEach((m,i)=>(m.material as T.MeshStandardMaterial).color.set(s.alternate?AUTUMN[i%4]:SUMMER[i%3]));
   labels.forEach((l,i)=>l.mesh.visible=i===sel);notes.forEach(n=>n.mesh.visible=s.alternate);
   flag.rotation.y=Math.sin(time*1.8)*.25;
   const lv=levelsFor(s.step,segment(s.progress,.1,.85));rack.set(lv,lv.map(v=>`${(v*3.2).toFixed(1)} km`));
  },
  camera(s){const t=s.progress;
   if(s.step===0)return shotPath(t,[[0,shot([0,7.6,8.2],[0,.6,-.4])],[.34,shot([-2.6,4.2,4.8],[-.7,.3,-.2])],[.67,shot([2.2,3.8,5.4],[.1,.4,1.4])]]);
   if(s.step===1)return shotPath(t,[[0,shot([-3.4,4.2,4.6],[-1.3,.6,.8])],[.34,shot([-.6,3.6,5.0],[-1.1,.6,1.1])],[.67,shot([.8,4.4,6.2],[-1.0,.6,.5])]]);
   return shotPath(t,[[0,shot([3.9,3.8,3.6],[1.2,1.0,-.8])],[.34,shot([2.5,3.7,-3.0],[0,.3,1.0])],[.67,shot([0,6.6,8.6],[0,.8,-.4])]]);
  }
 };
}
