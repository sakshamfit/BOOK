import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import type {Book} from '../catalog';
import type {Concept,WorldState} from './concepts';
import {initialWorldState} from './concepts';
import {conceptBuilders} from './scenes';
import {INK,SERIF,SANS,HAND,redrawCards,releaseCards,clamp01,ease,mix,segment,type Shot,type V3} from './kit';
export {conceptBuilders};

export type Timeline={step:number;progress:number;phase:'closed'|'opening'|'story'};
export type WorldCallbacks={onPick:(pick:number|'open'|'flap')=>void;onTick?:(t:Timeline)=>void;onStepEnd?:(step:number)=>void;onAmount?:(amount:number)=>void};
export const STEP_SECONDS=11;
const INTRO_SECONDS=3.2;
// Book dimensions: page width along x, page depth along z, spine on x=0.
const PW=6.6,PD=8.8,CT=.08,HB=.42,H=CT+HB;
const easeBack=(t:number)=>{t=clamp01(t);const c=1.5;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);};
const damp=(a:number,b:number,k:number,dt:number)=>b+(a-b)*Math.exp(-k*dt);

function canvas(w:number,h:number){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function wrap(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,width:number,lh:number){let yy=y;for(const para of text.split('\n')){let line='';for(const word of para.split(' ')){const next=line?line+' '+word:word;if(ctx.measureText(next).width>width&&line){ctx.fillText(line,x,yy);yy+=lh;line=word;}else line=next;}if(line){ctx.fillText(line,x,yy);yy+=lh;}}return yy;}
let grainLayer:HTMLCanvasElement|null=null;
function grain(ctx:CanvasRenderingContext2D,w:number,h:number,gutterRight:boolean){
 if(!grainLayer){grainLayer=canvas(w,h);const g=grainLayer.getContext('2d')!;for(let i=0;i<2600;i++){g.fillStyle=`rgba(90,80,60,${Math.random()*.05})`;g.fillRect(Math.random()*w,Math.random()*h,1.4,1.4);}}
 ctx.globalAlpha=1;ctx.fillStyle='#fbf8f0';ctx.fillRect(0,0,w,h);ctx.drawImage(grainLayer,0,0);
 const g=ctx.createLinearGradient(gutterRight?w-90:90,0,gutterRight?w:0,0);g.addColorStop(0,'rgba(70,58,40,0)');g.addColorStop(1,'rgba(70,58,40,.24)');ctx.fillStyle=g;ctx.fillRect(gutterRight?w-90:0,0,90,h);
}
function stripes(){const c=canvas(64,256),ctx=c.getContext('2d')!;ctx.fillStyle='#f3eddf';ctx.fillRect(0,0,64,256);for(let y=0;y<256;y+=3){ctx.fillStyle=`rgba(120,105,80,${.12+Math.random()*.18})`;ctx.fillRect(0,y,64,1);}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
function deskTexture(){const c=canvas(512,512),ctx=c.getContext('2d')!;ctx.fillStyle='#ffffff';ctx.fillRect(0,0,512,512);for(let i=0;i<9000;i++){ctx.fillStyle=`rgba(0,0,0,${Math.random()*.035})`;ctx.fillRect(Math.random()*512,Math.random()*512,2,2);}for(let i=0;i<60;i++){ctx.strokeStyle=`rgba(0,0,0,${.015+Math.random()*.02})`;ctx.beginPath();const y=Math.random()*512;ctx.moveTo(0,y);ctx.bezierCurveTo(170,y+Math.random()*20-10,340,y+Math.random()*20-10,512,y);ctx.stroke();}const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(7,7);t.colorSpace=T.SRGBColorSpace;return t;}

export function createWorld(container:HTMLDivElement,book:Book,c:Concept,cb:WorldCallbacks){
 const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
 container.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label',`Interactive 3D pop-up book: ${c.title}`);renderer.domElement.setAttribute('role','img');
 const desk=new T.Color(c.background).lerp(new T.Color('#7d8a73'),.32);
 const scene=new T.Scene();scene.background=desk.clone().multiplyScalar(.9);scene.fog=new T.Fog(scene.background,26,58);
 const camera=new T.PerspectiveCamera(30,1,.1,120);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.enablePan=false;controls.minDistance=3.5;controls.maxDistance=30;controls.minPolarAngle=.2;controls.maxPolarAngle=1.42;controls.rotateSpeed=.7;controls.zoomSpeed=.8;
 scene.add(new T.HemisphereLight('#fffaf0','#a2967f',1.55));
 const key=new T.DirectionalLight('#fff0d8',3.1);key.position.set(-6,13,7);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:1,far:40});key.shadow.camera.updateProjectionMatrix();key.shadow.bias=-.0004;key.shadow.normalBias=.025;scene.add(key);
 const fill=new T.DirectionalLight('#e3e9ff',.8);fill.position.set(8,6,2);scene.add(fill);
 const rim=new T.DirectionalLight('#ffe1c4',.6);rim.position.set(9,6,-9);scene.add(rim);
 // An unseen window frame between the light and the desk throws soft pane shadows, as on a sunny desk.
 const windowFrame=new T.Group();const shadowOnly=new T.MeshBasicMaterial({colorWrite:false,depthWrite:false});
 const bar=(w:number,h:number,x:number)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,.3),shadowOnly);m.castShadow=true;m.position.x=x;windowFrame.add(m);};bar(.35,16,-2.2);bar(.35,16,2.2);bar(16,.3,0);windowFrame.position.set(-4.6,9.8,5.4);windowFrame.lookAt(key.position.clone().multiplyScalar(-1));scene.add(windowFrame);
 const floor=new T.Mesh(new T.PlaneGeometry(140,140),new T.MeshStandardMaterial({color:desk,map:deskTexture(),roughness:.9}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);

 // The book: back cover + right page block, and a hinged front cover carrying the left page block.
 const bookGroup=new T.Group();scene.add(bookGroup);
 const boardMat=new T.MeshStandardMaterial({color:book.color,roughness:.62});const edgeTex=stripes();const edgeMat=new T.MeshStandardMaterial({map:edgeTex,roughness:.95});
 const blockMats=[edgeMat,edgeMat,edgeMat,edgeMat,edgeMat,edgeMat];
 const backCover=new T.Mesh(new T.BoxGeometry(PW+.16,CT,PD+.22),boardMat);backCover.position.set(PW/2+.02,CT/2,0);backCover.castShadow=backCover.receiveShadow=true;bookGroup.add(backCover);
 const rightBlock=new T.Mesh(new T.BoxGeometry(PW,HB,PD),blockMats);rightBlock.position.set(PW/2,CT+HB/2,0);rightBlock.castShadow=rightBlock.receiveShadow=true;bookGroup.add(rightBlock);
 const spine=new T.Mesh(new T.CylinderGeometry(H*.55,H*.55,PD+.22,24,1,false,Math.PI,Math.PI),boardMat);spine.rotation.x=Math.PI/2;spine.position.set(0,H*.5,0);spine.castShadow=true;bookGroup.add(spine);
 const crease=new T.Mesh(new T.CylinderGeometry(.03,.03,PD,8),new T.MeshBasicMaterial({color:'#8e826c',transparent:true,opacity:.35}));crease.rotation.x=Math.PI/2;crease.position.set(0,H+.004,0);bookGroup.add(crease);
 const pageCanvasR=canvas(900,1200),rctx=pageCanvasR.getContext('2d')!;const pageTexR=new T.CanvasTexture(pageCanvasR);pageTexR.colorSpace=T.SRGBColorSpace;pageTexR.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const rightPage=new T.Mesh(new T.PlaneGeometry(PW,PD),new T.MeshStandardMaterial({map:pageTexR,roughness:.97}));rightPage.rotation.x=-Math.PI/2;rightPage.position.set(PW/2,H+.002,0);rightPage.receiveShadow=true;bookGroup.add(rightPage);
 const hinge=new T.Group();hinge.position.set(0,H,0);hinge.userData.pick='open';bookGroup.add(hinge);
 const leftBlock=new T.Mesh(new T.BoxGeometry(PW,HB,PD),blockMats);leftBlock.position.set(PW/2,HB/2,0);leftBlock.castShadow=leftBlock.receiveShadow=true;hinge.add(leftBlock);
 const coverTex=new T.TextureLoader().load(book.cover);coverTex.colorSpace=T.SRGBColorSpace;coverTex.anisotropy=8;
 const coverMats=[boardMat,boardMat,new T.MeshStandardMaterial({map:coverTex,roughness:.55}),boardMat,boardMat,boardMat];
 const frontCover=new T.Mesh(new T.BoxGeometry(PW+.16,CT,PD+.22),coverMats);frontCover.position.set(PW/2+.02,HB+CT/2,0);frontCover.castShadow=frontCover.receiveShadow=true;hinge.add(frontCover);
 const pageCanvasL=canvas(900,1200),lctx=pageCanvasL.getContext('2d')!;const pageTexL=new T.CanvasTexture(pageCanvasL);pageTexL.colorSpace=T.SRGBColorSpace;pageTexL.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const leftGeometry=new T.PlaneGeometry(PW,PD);leftGeometry.applyMatrix4(new T.Matrix4().set(-1,0,0,0,0,0,-1,0,0,-1,0,0,0,0,0,1));leftGeometry.translate(PW/2,-.002,0);
 const leftPage=new T.Mesh(leftGeometry,new T.MeshStandardMaterial({map:pageTexL,roughness:.97}));leftPage.receiveShadow=true;hinge.add(leftPage);
 // "Lift the flap" card on the left page: it hides the answer to the current step.
 const flapCanvas=canvas(640,232),fctx=flapCanvas.getContext('2d')!;const flapTex=new T.CanvasTexture(flapCanvas);flapTex.colorSpace=T.SRGBColorSpace;
 const flapHinge=new T.Group();flapHinge.position.set(-PW+.59,H+.008,2.15);flapHinge.userData.pick='flap';bookGroup.add(flapHinge);
 const flapMats=[edgeMat,edgeMat,new T.MeshStandardMaterial({map:flapTex,roughness:.95}),new T.MeshStandardMaterial({color:'#efe8d6',roughness:1}),edgeMat,edgeMat];
 const flap=new T.Mesh(new T.BoxGeometry(3.9,.014,1.42),flapMats);flap.position.set(1.95,0,.71);flap.castShadow=true;flapHinge.add(flap);
 const drawFlap=()=>{fctx.fillStyle='#f6efdc';fctx.fillRect(0,0,640,232);fctx.strokeStyle=INK;fctx.lineWidth=4;fctx.strokeRect(8,8,624,216);fctx.fillStyle=INK;fctx.font=`700 30px ${SANS}`;fctx.fillText('Lift the flap',38,92);fctx.font=`400 26px ${SERIF}`;fctx.fillText('to see the answer',38,136);fctx.font=`700 46px ${HAND}`;fctx.fillStyle=c.accent;fctx.fillText('lift here',410,100);fctx.strokeStyle=c.accent;fctx.lineWidth=4;fctx.beginPath();fctx.moveTo(470,128);fctx.quadraticCurveTo(500,175,560,186);fctx.stroke();fctx.beginPath();fctx.moveTo(560,186);fctx.lineTo(538,170);fctx.moveTo(560,186);fctx.lineTo(540,200);fctx.stroke();flapTex.needsUpdate=true;};
 // Pages that flutter across during the opening.
 const sheetMat=new T.MeshStandardMaterial({color:'#faf6ec',roughness:.95,side:T.DoubleSide});
 const sheets=[0,1,2].map(()=>{const g=new T.PlaneGeometry(1,1,28,1);const m=new T.Mesh(g,sheetMat);m.castShadow=true;m.receiveShadow=true;m.visible=false;bookGroup.add(m);return m;});
 const bendSheet=(m:T.Mesh,theta:number,curl:number)=>{const pos=(m.geometry as T.PlaneGeometry).attributes.position as T.BufferAttribute;const n=28,ds=(PW-.06)/n;let x=0,y=H+.006;const xs:number[]=[],ys:number[]=[];for(let i=0;i<=n;i++){xs.push(x);ys.push(y);const a=theta+curl*(i/n)*Math.sin(theta);x+=Math.cos(a)*ds;y+=Math.sin(a)*ds;}for(let row=0;row<2;row++)for(let i=0;i<=n;i++){const k=row*(n+1)+i;pos.setXYZ(k,xs[i],ys[i],(row?.5:-.5)*(PD-.1));}pos.needsUpdate=true;m.geometry.computeVertexNormals();};

 // The pop-up model stands on the right page. Each top-level piece springs up from the paper.
 const popup=new T.Group();popup.position.set(PW/2,H,0);bookGroup.add(popup);
 const model=conceptBuilders[c.id](popup,c);
 const pivots=[...popup.children].map(child=>{const p=new T.Group();popup.add(p);p.attach(child);return p;});
 pivots.forEach((p,i)=>{const b=new T.Box3().setFromObject(p);const cz=Number.isFinite(b.min.z)?(b.min.z+b.max.z)/2:0;p.userData.delay=clamp01((cz+4)/8)*.35+(i%5)*.04;});
 const pickables:T.Object3D[]=[popup,hinge,flapHinge];

 let state:WorldState=initialWorldState(c),phase:Timeline['phase']='closed',introT=0,progress=0,lastStep=-1,lastReset=-1,stepEndSent=-1,shown=c.range.start,liveAmount=c.range.start,flapOpen=0,flapTarget=0,userCam=false,camReady=false;
 let raf=0,alive=true,visible=true,last=0,clock=0,inkT=1,pageKey='',lastClose=false;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const camPos=new T.Vector3(),camTarget=new T.Vector3();
 const toWorld=(v:V3)=>new T.Vector3(v[0]+PW/2,v[1]+H,v[2]);

 const drawLeft=(alpha:number)=>{
  const ctx=lctx,w=900,s=c.steps[state.step];grain(ctx,w,1200,true);ctx.globalAlpha=1;ctx.textBaseline='alphabetic';ctx.textAlign='left';
  ctx.fillStyle='rgba(38,36,31,.55)';ctx.font=`600 17px ${SANS}`;ctx.fillText(`FOLIO LIVING EDITION  ·  ${book.title.toUpperCase()}`,80,74);
  ctx.globalAlpha=alpha;ctx.fillStyle=c.accent;ctx.font=`700 19px ${SANS}`;ctx.fillText(`${state.step+1}   ${c.kicker}`,80,150);
  ctx.fillStyle=INK;ctx.font=`600 62px ${SERIF}`;let y=wrap(ctx,s.title,80,226,690,68);
  ctx.font=`italic 500 40px ${SERIF}`;ctx.fillStyle='#3b372f';ctx.fillText(c.formula,80,y+36);y+=96;
  ctx.font=`400 29px ${SERIF}`;ctx.fillStyle='#34312a';y=wrap(ctx,s.text,80,y,690,43);
  ctx.fillStyle=c.accent;ctx.font=`700 17px ${SANS}`;ctx.fillText('TRY THIS  →',80,y+34);ctx.font=`italic 400 27px ${SERIF}`;ctx.fillStyle='#3b372f';wrap(ctx,s.prompt,80,y+74,690,38);
  ctx.globalAlpha=1;ctx.fillStyle='#efe6cf';ctx.fillRect(80,900,520,190);ctx.fillStyle=c.accent;ctx.font=`700 16px ${SANS}`;ctx.fillText('THE ANSWER',104,940);ctx.fillStyle=INK;ctx.font=`400 25px ${SERIF}`;wrap(ctx,c.details[state.choice].replace(/\n/g,' · '),104,980,470,34);
  ctx.fillStyle='rgba(38,36,31,.5)';ctx.font=`500 18px ${SANS}`;ctx.fillText(String(state.step*2+1),80,1150);pageTexL.needsUpdate=true;
 };
 const drawRight=(alpha:number)=>{
  const ctx=rctx,s=c.steps[state.step];grain(ctx,900,1200,false);ctx.textAlign='left';ctx.globalAlpha=alpha;
  ctx.fillStyle='#3b372f';ctx.font=`italic 400 24px ${SERIF}`;ctx.fillText(`Fig. ${state.step+1}   ${s.figure}`,100,1080);
  ctx.fillStyle=INK;ctx.font=`700 22px ${SANS}`;ctx.fillText(s.prompt,100,1122,720);
  ctx.globalAlpha=1;ctx.fillStyle='rgba(38,36,31,.5)';ctx.font=`500 18px ${SANS}`;ctx.textAlign='right';ctx.fillText(String(state.step*2+2),820,1150);pageTexR.needsUpdate=true;
 };
 const redrawPages=(alpha=1)=>{drawLeft(alpha);drawRight(alpha);};
 drawFlap();redrawPages();
 const fonts=(document as Document&{fonts?:FontFaceSet}).fonts;
 if(fonts)Promise.all([`600 40px ${SERIF}`,`italic 400 40px ${SERIF}`,`600 20px ${SANS}`,`700 40px ${HAND}`].map(f=>fonts.load(f).catch(()=>[]))).then(()=>{if(!alive)return;drawFlap();redrawPages();redrawCards();});

 function frame(shotIn:Shot){
  const aspect=camera.aspect||1,factor=Math.pow(Math.max(1,1.5/aspect),.92)*(state.closeUp?.62:1)*(phase==='story'?1.3:1);
  const t=new T.Vector3(...shotIn.target),p=new T.Vector3(...shotIn.pos);return {pos:t.clone().add(p.sub(t).multiplyScalar(factor)),target:t};
 }
 function desiredShot(ms:WorldState):Shot{
  const open=ease(segment(introT,.1,1.9));
  const closedShot:Shot={pos:[7.4,12.5,11.8],target:[3.2,.3,.4]},spread:Shot={pos:[1.1,14.2,13.6],target:[.2,.3,.8]};
  if(phase==='closed')return closedShot;
  // While the cover swings, the camera arcs up and back so the whole movement stays in frame.
  if(phase==='opening'){const a=closedShot,b=spread,lift=Math.sin(open*Math.PI);return {pos:[mix(a.pos[0],b.pos[0],open)-lift*1.5,mix(a.pos[1],b.pos[1],open)+lift*6.5,mix(a.pos[2],b.pos[2],open)+lift*5],target:[mix(a.target[0],b.target[0],open),mix(a.target[1],b.target[1],open)+lift*1.2,mix(a.target[2],b.target[2],open)]};}
  const local=model.camera?.(ms)??((): Shot=>{const a=-.35+.55*ms.progress;return {pos:[Math.sin(a)*9.5,7.4,Math.cos(a)*10.5],target:[0,1.1,-.3]};})();
  const pos=toWorld(local.pos),target=toWorld(local.target);
  // Ease from the open-spread view into the first story shot.
  const blend=ease(segment(introT,INTRO_SECONDS-.2,INTRO_SECONDS+1.6));
  return {pos:[mix(spread.pos[0],pos.x,blend),mix(spread.pos[1],pos.y,blend),mix(spread.pos[2],pos.z,blend)],target:[mix(spread.target[0],target.x,blend),mix(spread.target[1],target.y,blend),mix(spread.target[2],target.z,blend)]};
 }
 function fit(){const w=container.clientWidth||1,h=container.clientHeight||1;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
 const resize=new ResizeObserver(fit);resize.observe(container);fit();
 const seen=new IntersectionObserver(([e])=>{visible=e.isIntersecting;},{threshold:.01});seen.observe(container);
 const onStart=()=>{userCam=true;};controls.addEventListener('start',onStart);

 // Picking, hover feedback and draggable handles.
 const ray=new T.Raycaster(),ndc=new T.Vector2();let down={x:0,y:0},drag:{x:number;amount:number}|null=null,hoverQueued=false,lastMove:PointerEvent|null=null;
 const hitAt=(e:PointerEvent)=>{const r=renderer.domElement.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);const targets=phase==='closed'||introT<1.2?[hinge]:[popup,flapHinge];for(const hit of ray.intersectObjects(targets,true)){let o:T.Object3D|null=hit.object,hidden=false;for(let a:T.Object3D|null=o;a;a=a.parent)if(!a.visible){hidden=true;break;}if(hidden)continue;let handle=false;while(o){if(o.userData.handle)handle=true;if(o.userData.pick!==undefined)return {pick:o.userData.pick as number|'open'|'flap',handle};o=o.parent;}if(handle)return {pick:undefined,handle};}return null;};
 const pd=(e:PointerEvent)=>{down={x:e.clientX,y:e.clientY};const hit=hitAt(e);if(hit?.handle&&phase==='story'){drag={x:e.clientX,amount:liveAmount};controls.enabled=false;renderer.domElement.setPointerCapture(e.pointerId);}};
 const pm=(e:PointerEvent)=>{if(drag){const span=c.range.max-c.range.min;const next=Math.round(Math.min(c.range.max,Math.max(c.range.min,drag.amount+(e.clientX-drag.x)/renderer.domElement.clientWidth*span*1.6)));cb.onAmount?.(next);return;}lastMove=e;if(!hoverQueued){hoverQueued=true;requestAnimationFrame(()=>{hoverQueued=false;if(!lastMove||!alive)return;const hit=hitAt(lastMove);renderer.domElement.style.cursor=hit?.handle?'ew-resize':hit?.pick!==undefined?'pointer':'grab';});}};
 const pu=(e:PointerEvent)=>{if(drag){drag=null;controls.enabled=true;return;}if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)return;const hit=hitAt(e);if(!hit||hit.pick===undefined)return;if(hit.pick==='flap'){flapTarget=flapTarget?0:1;}cb.onPick(hit.pick);};
 renderer.domElement.addEventListener('pointerdown',pd);renderer.domElement.addEventListener('pointermove',pm);renderer.domElement.addEventListener('pointerup',pu);

 function animate(time:number){
  if(!alive)return;raf=requestAnimationFrame(animate);if(!visible||document.hidden){last=time;return;}
  const dt=Math.min((time-last)/1000,.05);last=time;if(!reduced)clock+=dt;
  if(state.open&&phase==='closed')phase='opening';
  if(phase==='opening'){introT=reduced?INTRO_SECONDS+2:introT+dt;if(introT>=INTRO_SECONDS)phase='story';}else if(phase==='story'&&introT<INTRO_SECONDS+2)introT+=dt;
  // Cover, fluttering pages and the rising pop-up.
  const coverT=ease(segment(introT,.15,1.75));hinge.rotation.z=coverT*Math.PI;
  sheets.forEach((m,k)=>{const t=segment(introT,1.05+k*.17,1.85+k*.17);m.visible=t>0&&t<1;if(m.visible)bendSheet(m,ease(t)*Math.PI,.85-k*.15);});
  pivots.forEach(p=>{const d=p.userData.delay as number;const e=reduced&&phase!=='closed'?1:easeBack(segment(introT,1.7+d,2.55+d));p.scale.y=Math.max(.001,e);p.visible=e>.002;});
  flapHinge.visible=coverT>.98;flapOpen=reduced?flapTarget:damp(flapOpen,flapTarget,6,dt);flapHinge.rotation.x=-flapOpen*2.5;
  // Story timeline.
  if(state.step!==lastStep||state.reset!==lastReset){lastStep=state.step;lastReset=state.reset;progress=state.progress;stepEndSent=-1;userCam=false;}
  if(phase==='story'&&state.playing)progress=Math.min(1,progress+dt/STEP_SECONDS);
  if(phase==='story'&&state.playing&&progress>=1&&stepEndSent!==state.step){stepEndSent=state.step;cb.onStepEnd?.(state.step);}
  const step=c.steps[state.step],from=state.step===0?c.range.start:c.steps[state.step-1].amount;
  liveAmount=state.playing&&phase==='story'?mix(from,step.amount,ease(segment(progress,.05,.72))):state.amount;
  shown=camReady?damp(shown,liveAmount,7,dt):liveAmount;
  const ms={...state,amount:shown,progress};model.update(ms,clock);
  if(model.sun){const s=model.sun(ms);key.position.set(s[0]+PW/2,s[1]+H,s[2]);key.target.position.set(PW/2,H,0);key.target.updateMatrixWorld();windowFrame.visible=false;}
  const pageId=`${state.step}|${state.choice}`;if(pageId!==pageKey){pageKey=pageId;inkT=reduced?1:0;}
  if(inkT<1){inkT=Math.min(1,inkT+dt*2.2);redrawPages(ease(inkT));}
  cb.onTick?.({step:state.step,progress,phase});
  // Camera direction: follows each shot unless the reader takes over.
  if(state.closeUp!==lastClose){lastClose=state.closeUp;userCam=false;}
  if(!userCam){const s=frame(desiredShot(ms));const k=camReady&&!reduced?2.3:1000;camPos.set(damp(camPos.x,s.pos.x,k,dt),damp(camPos.y,s.pos.y,k,dt),damp(camPos.z,s.pos.z,k,dt));camTarget.set(damp(camTarget.x,s.target.x,k,dt),damp(camTarget.y,s.target.y,k,dt),damp(camTarget.z,s.target.z,k,dt));if(!camReady){camPos.copy(s.pos);camTarget.copy(s.target);camReady=true;}
   camera.position.copy(camPos);if(!reduced)camera.position.add(new T.Vector3(Math.sin(clock*.23)*.1,Math.sin(clock*.19)*.07,Math.cos(clock*.17)*.09));controls.target.copy(camTarget);}
  controls.update();renderer.render(scene,camera);
 }
 raf=requestAnimationFrame(t=>{last=t;animate(t);});
 return {
  setState(next:WorldState){state=next;},
  live(){return {amount:liveAmount,progress,step:state.step,phase};},
  recenter(){userCam=false;},
  dispose(){alive=false;cancelAnimationFrame(raf);resize.disconnect();seen.disconnect();controls.removeEventListener('start',onStart);controls.dispose();renderer.domElement.removeEventListener('pointerdown',pd);renderer.domElement.removeEventListener('pointermove',pm);renderer.domElement.removeEventListener('pointerup',pu);releaseCards();
   const textures=new Set<T.Texture>();scene.traverse(o=>{const mesh=o as T.Mesh;mesh.geometry?.dispose();if(mesh.material){for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material]){for(const v of Object.values(m))if(v instanceof T.Texture)textures.add(v);m.dispose();}}});textures.forEach(t=>t.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();},
  pickables
 };
}
