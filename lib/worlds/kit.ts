import * as T from 'three';
import type {WorldState} from './concepts';

// Drawing kit for the pop-up dioramas: paper surfaces shaded with pencil hatching,
// ink outlines, glass jars of coloured "stores", flowing ribbons and handwritten cards.
// Every helper builds plain three.js objects so the scenes stay testable without a GPU.

export const INK='#26241f';
export const PAPER='#f7f3ea';
export type V3=[number,number,number];
export type Shot={pos:V3;target:V3};
// camera: the shot for the current step/progress, in pop-up coordinates (origin on the right page).
// sun: optional key-light position relative to the pop-up, for scenes that are about light.
export type Model={update:(s:WorldState,time:number)=>void;camera?:(s:WorldState)=>Shot;sun?:(s:WorldState)=>V3};

export const clamp01=(v:number)=>Math.min(1,Math.max(0,v));
export const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
export const segment=(t:number,a:number,b:number)=>clamp01((t-a)/(b-a));
export const ease=(t:number)=>{t=clamp01(t);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
export const easeOut=(t:number)=>1-Math.pow(1-clamp01(t),3);
export const lerp3=(a:V3,b:V3,t:number):V3=>[mix(a[0],b[0],t),mix(a[1],b[1],t),mix(a[2],b[2],t)];
export const shot=(pos:V3,target:V3):Shot=>({pos,target});
// Blend between camera shots by progress: [[at,shot],...] sorted by at.
export function shotPath(progress:number,keys:[number,Shot][]):Shot{
 if(progress<=keys[0][0])return keys[0][1];
 for(let i=1;i<keys.length;i++){const [b,sb]=keys[i],[a,sa]=keys[i-1];if(progress<=b){const t=ease(segment(progress,a,b));return {pos:lerp3(sa.pos,sb.pos,t),target:lerp3(sa.target,sb.target,t)};}}
 return keys[keys.length-1][1];
}

const HATCH=`
varying vec3 vHatchPos;varying vec3 vHatchNormal;
uniform float uHatchDensity;uniform float uHatchStrength;uniform vec3 uHatchInk;
float hatchCov(float coord,float width){
 float w=fwidth(coord);float dist=.5-abs(fract(coord)-.5);
 float line=1.-smoothstep(width-w,width+w,dist);
 float fade=1.-smoothstep(.3,.65,w);
 return mix(width*2.,line,fade)*step(.002,width);
}
float hatchTone(vec3 p,vec3 n,float w1,float w2,float k){
 vec3 a=pow(abs(n),vec3(4.));a/=a.x+a.y+a.z+1e-4;
 float x=max(hatchCov(p.z*k,w1),hatchCov((p.y+p.z)*.7071*k,w2));
 float y=max(hatchCov((p.x+p.z)*.7071*k,w1),hatchCov((p.x-p.z)*.7071*k,w2));
 float z=max(hatchCov(p.x*k,w1),hatchCov((p.x+p.y)*.7071*k,w2));
 return a.x*x+a.y*y+a.z*z;
}`;
const HATCH_APPLY=`
float hLum=dot(outgoingLight,vec3(.2126,.7152,.0722));
float hBase=max(dot(diffuseColor.rgb,vec3(.2126,.7152,.0722)),.08);
float hShade=clamp(1.-hLum/(hBase*1.08),0.,1.);
float hw1=clamp((hShade-.14)*.36,0.,.25)*uHatchStrength;
float hw2=clamp((hShade-.52)*.4,0.,.19)*uHatchStrength;
float hc=hatchTone(vHatchPos,normalize(vHatchNormal),hw1,hw2,uHatchDensity);
float hg=fract(sin(dot(floor(vHatchPos.xz*160.+vHatchPos.y*37.),vec2(12.9898,78.233)))*43758.5453);
outgoingLight=mix(outgoingLight,uHatchInk*(.5+.5*min(hLum,1.)),clamp(hc*(.8+.2*hg),0.,1.)*.9);
#include <opaque_fragment>`;

export type PaperOptions={density?:number;strength?:number;roughness?:number;opacity?:number;emissive?:string;emissiveIntensity?:number};
export function paper(color:string=PAPER,o:PaperOptions={}){
 const m=new T.MeshStandardMaterial({color,roughness:o.roughness??.94,metalness:0,transparent:o.opacity!==undefined,opacity:o.opacity??1});
 if(o.emissive){m.emissive.set(o.emissive);m.emissiveIntensity=o.emissiveIntensity??.3;}
 const density=o.density??15,strength=o.strength??1;
 m.onBeforeCompile=shader=>{
  shader.uniforms.uHatchDensity={value:density};shader.uniforms.uHatchStrength={value:strength};shader.uniforms.uHatchInk={value:new T.Color(INK)};
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vHatchPos;varying vec3 vHatchNormal;').replace('#include <fog_vertex>','#include <fog_vertex>\nvHatchPos=(modelMatrix*vec4(transformed,1.)).xyz;vHatchNormal=normalize(mat3(modelMatrix)*objectNormal);');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>'+HATCH).replace('#include <opaque_fragment>',HATCH_APPLY);
 };
 m.customProgramCacheKey=()=>'folio-hatch';
 return m;
}
export function hullMaterial(width:number){
 const m=new T.MeshBasicMaterial({color:INK,side:T.BackSide});
 m.onBeforeCompile=shader=>{shader.uniforms.uHull={value:width};shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float uHull;').replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed+=normalize(normal)*uHull;');};
 m.customProgramCacheKey=()=>'folio-hull';
 return m;
}
export function inkLines(opacity=.92,color=INK){return new T.LineBasicMaterial({color,transparent:opacity<1,opacity});}

export type SolidOptions={outline?:'edges'|'hull'|'none';hull?:number;threshold?:number;shadow?:boolean}&PaperOptions;
export function solid(p:T.Object3D,geometry:T.BufferGeometry,color:string=PAPER,at:V3=[0,0,0],o:SolidOptions={}){
 const m=new T.Mesh(geometry,paper(color,o));m.position.set(...at);m.castShadow=o.shadow!==false;m.receiveShadow=true;p.add(m);
 const outline=o.outline??'edges';
 if(outline==='edges')m.add(new T.LineSegments(new T.EdgesGeometry(geometry,o.threshold??28),inkLines()));
 if(outline==='hull'){const h=new T.Mesh(geometry,hullMaterial(o.hull??.014));h.castShadow=false;h.raycast=()=>{};m.add(h);}
 return m;
}
export function group(p:T.Object3D,x=0,y=0,z=0,pick?:number|string){const g=new T.Group();g.position.set(x,y,z);if(pick!==undefined)g.userData.pick=pick;p.add(g);return g;}
export const box=(p:T.Object3D,w:number,h:number,d:number,color=PAPER,x=0,y=0,z=0,o:SolidOptions={})=>solid(p,new T.BoxGeometry(w,h,d),color,[x,y,z],o);
export const cyl=(p:T.Object3D,rTop:number,rBottom:number,h:number,color=PAPER,x=0,y=0,z=0,o:SolidOptions={})=>solid(p,new T.CylinderGeometry(rTop,rBottom,h,40),color,[x,y,z],{outline:'hull',...o});
export const sphere=(p:T.Object3D,r:number,color=PAPER,x=0,y=0,z=0,o:SolidOptions={})=>solid(p,new T.SphereGeometry(r,32,20),color,[x,y,z],{outline:'hull',...o});
export const capsule=(p:T.Object3D,r:number,len:number,color=PAPER,x=0,y=0,z=0,o:SolidOptions={})=>solid(p,new T.CapsuleGeometry(r,len,6,16),color,[x,y,z],{outline:'hull',hull:.008,...o});
// Lathe profile as [radius,height] pairs, bottom to top.
export function lathe(p:T.Object3D,profile:[number,number][],color=PAPER,x=0,y=0,z=0,o:SolidOptions={}){return solid(p,new T.LatheGeometry(profile.map(([r,h])=>new T.Vector2(Math.max(r,.0001),h)),56),color,[x,y,z],{outline:'hull',...o});}
export function extrude(p:T.Object3D,shape:T.Shape,depth:number,color=PAPER,x=0,y=0,z=0,o:SolidOptions={}){
 const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:1,curveSegments:28});g.translate(0,0,-depth/2);
 return solid(p,g,color,[x,y,z],{threshold:35,...o});
}
export function tube(p:T.Object3D,points:V3[],r:number,color=PAPER,o:SolidOptions&{closed?:boolean;segments?:number}={}){
 const curve=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v)),o.closed??false,'catmullrom',.4);
 return solid(p,new T.TubeGeometry(curve,o.segments??120,r,10,o.closed??false),color,[0,0,0],{outline:'hull',hull:.008,...o});
}
// Arch shape (a doorway or gallery arch) in the XY plane, centred on x=0, base at y=0.
export function archShape(w:number,h:number,inner?:{w:number;h:number}){
 const s=new T.Shape();const r=w/2;s.moveTo(-r,0);s.lineTo(-r,h-r);s.absarc(0,h-r,r,Math.PI,0,true);s.lineTo(r,0);s.lineTo(-r,0);
 if(inner){const ir=inner.w/2;const hole=new T.Path();hole.moveTo(-ir,0);hole.lineTo(ir,0);hole.lineTo(ir,inner.h-ir);hole.absarc(0,inner.h-ir,ir,0,Math.PI,false);hole.lineTo(-ir,0);s.holes.push(hole);}
 return s;
}
export function setTint(o:T.Object3D,color:string,amount:number,base:string=PAPER){
 const from=new T.Color(base),to=new T.Color(color);
 o.traverse(n=>{const m=n as T.Mesh;if(m.isMesh&&m.material instanceof T.MeshStandardMaterial&&!m.userData.keepColor){m.material.color.copy(from).lerp(to,amount);m.material.emissive.set(amount>.01?color:'#000000');m.material.emissiveIntensity=amount*.12;}});
}

// Soft radial texture used for glows, light pools and contact shadows.
function radialTexture(){
 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d')!;
 const g=ctx.createRadialGradient?.(64,64,0,64,64,64);if(g){g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.45,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);}
 const t=new T.CanvasTexture(c as HTMLCanvasElement);t.colorSpace=T.SRGBColorSpace;return t;
}
export function pool(p:T.Object3D,color:string,radius:number,x=0,y=.012,z=0,opacity=.5){
 const m=new T.Mesh(new T.PlaneGeometry(radius*2,radius*2),new T.MeshBasicMaterial({map:radialTexture(),color,transparent:true,opacity,depthWrite:false}));
 m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.renderOrder=2;m.raycast=()=>{};m.userData.keepColor=true;p.add(m);return m;
}
export function glow(p:T.Object3D,color:string,size:number,x=0,y=0,z=0,opacity=.6){
 const s=new T.Sprite(new T.SpriteMaterial({map:radialTexture(),color,transparent:true,opacity,depthWrite:false,blending:T.AdditiveBlending}));
 s.scale.set(size,size,1);s.position.set(x,y,z);s.raycast=()=>{};p.add(s);return s;
}

// Glass with an ink silhouette that follows the view, like a pencil drawing of a jar.
export function glassMaterial(){
 return new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{uInk:{value:new T.Color(INK)}},
  vertexShader:'varying vec3 vN;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform vec3 uInk;varying vec3 vN;varying vec3 vV;void main(){float f=1.-abs(dot(normalize(vN),normalize(vV)));float edge=smoothstep(.8,.97,f);float sheen=smoothstep(.4,.75,f)*.1;gl_FragColor=vec4(mix(vec3(1.),uInk,edge*.8),.09+sheen+edge*.7);}'});
}

// Handwritten / printed paper cards with canvas text. Cards redraw once fonts arrive.
const redrawers=new Set<()=>void>();
export function redrawCards(){redrawers.forEach(f=>f());}
export function releaseCards(){redrawers.clear();}
export const HAND='"Caveat Variable", "Segoe Print", cursive';
export const SERIF='"Newsreader Variable", Georgia, serif';
export const SANS='"Schibsted Grotesk Variable", Arial, sans-serif';
export type Card={mesh:T.Mesh;set:(lines:string[])=>void};
export function card(p:T.Object3D,lines:string[],o:{w?:number;h?:number;x?:number;y?:number;z?:number;rx?:number;ry?:number;rz?:number;hand?:boolean;accent?:string;bg?:string}={}){
 const w=o.w??1.3,h=o.h??.8,px=512,py=Math.round(512*h/w);const c=document.createElement('canvas');c.width=px;c.height=py;const ctx=c.getContext('2d')!;
 const texture=new T.CanvasTexture(c as HTMLCanvasElement);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
 let current=lines;
 const draw=()=>{
  ctx.fillStyle=o.bg??'#fffdf6';ctx.fillRect(0,0,px,py);ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.strokeRect(9,9,px-18,py-18);
  if(o.accent){ctx.fillStyle=o.accent;ctx.fillRect(9,9,14,py-18);}
  const [first,...rest]=current;const big=Math.min(py*.46,o.hand===false?60:118);
  ctx.fillStyle=INK;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font=o.hand===false?`600 ${big}px ${SERIF}`:`700 ${big}px ${HAND}`;
  ctx.fillText(first??'',px/2,rest.length?py*.42:py*.52,px-50);
  ctx.font=`500 ${Math.min(py*.17,40)}px ${o.hand===false?SANS:HAND}`;
  rest.forEach((line,i)=>ctx.fillText(line,px/2,py*.42+big*.62+i*Math.min(py*.17,40)*1.15,px-50));
  texture.needsUpdate=true;
 };
 draw();redrawers.add(draw);
 const side=paper(PAPER,{strength:.4});const face=new T.MeshStandardMaterial({map:texture,roughness:.95});
 const mesh=new T.Mesh(new T.BoxGeometry(w,h,.03),[side,side,side,side,face,side]);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.keepColor=true;
 mesh.add(new T.LineSegments(new T.EdgesGeometry(mesh.geometry),inkLines(.8)));
 mesh.position.set(o.x??0,o.y??h/2,o.z??0);mesh.rotation.set(o.rx??0,o.ry??0,o.rz??0);mesh.scale.setScalar(.82);p.add(mesh);
 mesh.addEventListener('removed',()=>redrawers.delete(draw));
 return {mesh,set(next:string[]){if(next.join('\n')===current.join('\n'))return;current=next;draw();}} as Card;
}

// A glass jar holding a coloured "store" that fills and drains.
export type Jar={group:T.Group;set:(level:number,value?:string)=>void};
export function jar(p:T.Object3D,color:string,label:string,o:{x?:number;y?:number;z?:number;r?:number;h?:number;value?:string}={}){
 const r=o.r??.3,h=o.h??.9;const g=group(p,o.x??0,o.y??0,o.z??0);
 cyl(g,r*1.02,r*1.06,.06,PAPER,0,.03,0,{hull:.01});
 const liquidGeometry=new T.CylinderGeometry(r*.9,r*.9,1,40);liquidGeometry.translate(0,.5,0);
 const liquid=new T.Mesh(liquidGeometry,new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.45,roughness:.25,transparent:true,opacity:.86}));liquid.position.y=.06;liquid.userData.keepColor=true;liquid.castShadow=false;g.add(liquid);
 const surface=new T.Mesh(new T.CircleGeometry(r*.9,40),new T.MeshBasicMaterial({color:new T.Color(color).lerp(new T.Color('#ffffff'),.35)}));surface.rotation.x=-Math.PI/2;surface.userData.keepColor=true;g.add(surface);
 const glass=new T.Mesh(new T.CylinderGeometry(r,r,h,48,1,true),glassMaterial());glass.position.y=h/2+.06;glass.renderOrder=3;glass.raycast=()=>{};g.add(glass);
 const rim=new T.Mesh(new T.TorusGeometry(r,.0055,5,48),new T.MeshBasicMaterial({color:'#5d5a52',transparent:true,opacity:.75}));rim.rotation.x=Math.PI/2;rim.position.y=h+.06;g.add(rim);
 for(let i=1;i<4;i++){const tick=new T.Mesh(new T.BoxGeometry(.09,.008,.004),new T.MeshBasicMaterial({color:INK}));tick.position.set(-r*.55,.06+h*i/4,r*.86);g.add(tick);}
 const light=pool(g,color,r*2.6,0,.004,0,.45);const halo=glow(g,color,r*3.2,0,h*.4,0,.35);
 const tag=card(g,[o.value??'0',label],{w:r*2.3,h:r*1.35,x:0,y:r*.8,z:r+.05,rx:-.12});
 const set=(level:number,value?:string)=>{const l=Math.max(.001,clamp01(level));liquid.scale.y=l*(h-.08);surface.position.y=.061+l*(h-.08);surface.visible=l>.01;(light.material as T.MeshBasicMaterial).opacity=.12+l*.42;(halo.material as T.SpriteMaterial).opacity=.08+l*.38;if(value!==undefined)tag.set([value,label]);};
 set(0);return {group:g,set} as Jar;
}
// A little rack of jars standing on two posts, as in a lab diagram.
export function jarRack(p:T.Object3D,stores:{label:string;color:string}[],o:{x?:number;z?:number;ry?:number;spacing?:number;r?:number;h?:number}={}){
 const spacing=o.spacing??.82,width=spacing*stores.length+.25;const g=group(p,o.x??0,0,o.z??0);g.rotation.y=o.ry??0;
 box(g,width,.07,.62,PAPER,0,.62,0);for(const x of [-width/2+.08,width/2-.08])box(g,.07,.62,.07,PAPER,x,.31,-.22);
 box(g,width,.04,.58,PAPER,0,.02,0);
 const jars=stores.map((s,i)=>jar(g,s.color,s.label,{x:(i-(stores.length-1)/2)*spacing,y:.655,z:0,r:o.r??.25,h:o.h??.78}));
 return {group:g,set(levels:number[],values?:string[]){jars.forEach((j,i)=>j.set(levels[i]??0,values?.[i]));}};
}

// A flat ribbon that flows along a path; set(head,tail) reveals a moving section of it.
export function ribbon(p:T.Object3D,points:V3[],color:string,o:{width?:number;twist?:number;segments?:number}={}){
 const curve=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v)));const n=o.segments??140,width=o.width??.13,twist=o.twist??1.5;
 const frames=curve.computeFrenetFrames(n,false);const pos:number[]=[],idx:number[]=[];
 for(let i=0;i<=n;i++){const pt=curve.getPointAt(i/n),a=twist*Math.PI*i/n+Math.sin(i/n*9)*.35;const dir=frames.normals[i].clone().multiplyScalar(Math.cos(a)).add(frames.binormals[i].clone().multiplyScalar(Math.sin(a))).multiplyScalar(width/2);pos.push(pt.x+dir.x,pt.y+dir.y,pt.z+dir.z,pt.x-dir.x,pt.y-dir.y,pt.z-dir.z);if(i<n){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(pos,3));geometry.setIndex(idx);geometry.computeVertexNormals();
 const m=new T.Mesh(geometry,new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.32,roughness:.55,side:T.DoubleSide,transparent:true,opacity:.92}));m.userData.keepColor=true;m.castShadow=true;m.raycast=()=>{};p.add(m);
 const set=(head:number,tail=0)=>{const a=Math.floor(clamp01(Math.min(head,tail))*n),b=Math.floor(clamp01(Math.max(head,tail))*n);geometry.setDrawRange(a*6,Math.max(0,b-a)*6);m.visible=b>a;};
 set(1);return {mesh:m,curve,set};
}
// Expanding rings (sound, heat or attention) that pulse outward from a point.
export function waves(p:T.Object3D,color:string,o:{x?:number;y?:number;z?:number;count?:number;size?:number;arc?:number;rx?:number;ry?:number}={}){
 const g=group(p,o.x??0,o.y??0,o.z??0);g.rotation.set(o.rx??0,o.ry??0,0);const count=o.count??4,size=o.size??1;
 const rings=Array.from({length:count},()=>{const m=new T.Mesh(new T.TorusGeometry(1,.022,6,64,o.arc??Math.PI*2),new T.MeshBasicMaterial({color,transparent:true,depthWrite:false}));m.userData.keepColor=true;m.raycast=()=>{};g.add(m);return m;});
 const update=(time:number,intensity:number)=>{rings.forEach((m,i)=>{const ph=((time*.45+i/count)%1+1)%1;m.scale.setScalar(.15+ph*size);(m.material as T.MeshBasicMaterial).opacity=(1-ph)*clamp01(intensity)*.9;m.visible=intensity>.01;});};
 update(0,1);return {group:g,update};
}
// Dashed construction line.
export function dashed(p:T.Object3D,points:V3[],color=INK,dash=.08){
 const g=new T.BufferGeometry().setFromPoints(points.map(v=>new T.Vector3(...v)));const l=new T.Line(g,new T.LineDashedMaterial({color,dashSize:dash,gapSize:dash*.8,transparent:true,opacity:.75}));l.computeLineDistances();l.raycast=()=>{};p.add(l);return l;
}
export function arrow(p:T.Object3D,from:V3,to:V3,color:string,r=.035){
 const a=new T.Vector3(...from),b=new T.Vector3(...to),dir=b.clone().sub(a),len=dir.length();const g=group(p,...from);
 g.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());
 cyl(g,r,r,len*.78,color,0,len*.39,0,{hull:.006,shadow:false});cyl(g,0,r*2.6,len*.22,color,0,len*.89,0,{hull:.006,shadow:false});
 return g;
}

// Articulated artist's mannequin, about one unit tall, facing +z.
export type Figure={root:T.Group;walk:(phase:number,amount?:number)=>void;pose:(p:{hips?:number;knees?:number;shoulders?:number;elbows?:number;lean?:number;head?:number;armSpread?:number})=>void};
export function mannequin(p:T.Object3D,color=PAPER,height=1){
 const root=group(p);root.scale.setScalar(height);const o={hull:.006};
 const pelvis=group(root,0,.5,0);sphere(pelvis,.07,color,0,0,0,o).scale.set(1.25,.8,.9);
 const spine=group(pelvis,0,.03,0);capsule(spine,.06,.12,color,0,.12,0,o);const chest=sphere(spine,.085,color,0,.24,0,o);chest.scale.set(1.25,1,.85);
 cyl(spine,.022,.026,.06,color,0,.34,0,o);const head=group(spine,0,.42,0);sphere(head,.068,color,0,0,.005,o).scale.set(.92,1.12,.98);
 const limb=(parent:T.Object3D,x:number,y:number,len:number,r:number)=>{const j=group(parent,x,y,0);sphere(j,r*1.12,color,0,0,0,o);capsule(j,r,len,color,0,-len/2-r*.4,0,o);return j;};
 const shoulders=[-1,1].map(s=>limb(spine,s*.11,.28,.13,.026));const elbows=shoulders.map(sh=>limb(sh,0,-.18,.12,.022));elbows.forEach(e=>sphere(e,.028,color,0,-.17,0,o));
 const hips=[-1,1].map(s=>limb(pelvis,s*.058,-.03,.18,.034));const knees=hips.map(h=>limb(h,0,-.235,.17,.029));knees.forEach(k=>box(k,.06,.035,.12,color,0,-.215,.03,{threshold:20}));
 const pose:Figure['pose']=q=>{
  hips.forEach(h=>h.rotation.x=-(q.hips??0));knees.forEach(k=>k.rotation.x=q.knees??0);shoulders.forEach((s,i)=>{s.rotation.x=-(q.shoulders??0);s.rotation.z=(i?1:-1)*(q.armSpread??.08);});elbows.forEach(e=>e.rotation.x=-(q.elbows??.15));spine.rotation.x=q.lean??0;head.rotation.x=q.head??0;pelvis.position.y=.5;
 };
 const walk=(phase:number,amount=1)=>{
  const s=Math.sin(phase);hips[0].rotation.x=-s*.5*amount;hips[1].rotation.x=s*.5*amount;
  knees[0].rotation.x=Math.max(0,Math.sin(phase-1.3))*.85*amount;knees[1].rotation.x=Math.max(0,Math.sin(phase+Math.PI-1.3))*.85*amount;
  shoulders[0].rotation.x=s*.42*amount;shoulders[1].rotation.x=-s*.42*amount;shoulders.forEach((sh,i)=>sh.rotation.z=(i?1:-1)*.08);elbows.forEach(e=>e.rotation.x=-.3*amount-.1);
  pelvis.position.y=.5+Math.abs(Math.cos(phase))*.014*amount;spine.rotation.x=.05*amount;head.rotation.x=0;
 };
 pose({});return {root,walk,pose} as Figure;
}
