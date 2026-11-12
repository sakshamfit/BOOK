import * as T from 'three';
import type {Concept} from '../concepts';
import {PAPER,INK,HAND,box,cyl,sphere,lathe,extrude,group,tube,solid,card,jarRack,ribbon,waves,glow,setTint,shot,shotPath,ease,segment,mix,clamp01,type Model,type V3} from '../kit';

// Small Hours: a desk under an arched window at night. Light the candle, let word cards drift up
// from the notebook into a poem, then bring the morning up behind the rooftops.
const CX=-.3,WALL_Z=-2.75;
function wallShape(){
 const s=new T.Shape();s.moveTo(-2.8,0);s.lineTo(2.8,0);s.lineTo(2.8,3.5);s.lineTo(-2.8,3.5);s.lineTo(-2.8,0);
 const h=new T.Path();h.moveTo(CX-1.15,1.0);h.lineTo(CX+1.15,1.0);h.lineTo(CX+1.15,2.0);h.absarc(CX,2.0,1.15,0,Math.PI,false);h.lineTo(CX-1.15,1.0);s.holes.push(h);return s;
}
function skylineShape(){
 const pts:[number,number][]=[[-1.4,.9],[-1.4,1.42],[-1.15,1.6],[-.9,1.42],[-.9,1.3],[-.6,1.3],[-.6,1.72],[-.52,1.72],[-.52,1.55],[-.25,1.55],[-.25,1.35],[.1,1.35],[.1,1.5],[.3,1.68],[.5,1.5],[.5,1.25],[.75,1.25],[.75,1.62],[.82,1.62],[.82,1.45],[1.05,1.45],[1.05,1.2],[1.4,1.2],[1.4,.9]];
 const s=new T.Shape();pts.forEach(([x,y],i)=>{if(i)s.lineTo(CX+x,y);else s.moveTo(CX+x,y);});s.lineTo(CX-1.4,.9);return s;
}
function crescent(){const s=new T.Shape(),n=20;for(let i=0;i<=n;i++){const t=-Math.PI/2+Math.PI*i/n;const x=-.2*Math.cos(t),y=.2*Math.sin(t);if(i)s.lineTo(x,y);else s.moveTo(x,y);}for(let i=n;i>=0;i--){const t=-Math.PI/2+Math.PI*i/n;s.lineTo(-.07*Math.cos(t),.2*Math.sin(t));}return s;}
function starShape(r:number){const s=new T.Shape();for(let i=0;i<=8;i++){const a=i/8*Math.PI*2,rr=i%2?r*.32:r;const x=Math.sin(a)*rr,y=Math.cos(a)*rr;if(i)s.lineTo(x,y);else s.moveTo(x,y);}return s;}

export function buildHours(p:T.Group,c:Concept):Model{
 const [violet]=c.colors;
 // Night sky with vertex-coloured gradient, rooftops, moon, stars and a rising sun.
 const skyGeo=new T.PlaneGeometry(2.7,2.5);skyGeo.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(12),3));
 const sky=new T.Mesh(skyGeo,new T.MeshBasicMaterial({vertexColors:true}));sky.position.set(CX,2.1,WALL_Z-.32);sky.userData.keepColor=true;p.add(sky);
 const sun=group(p,CX+.45,1.1,WALL_Z-.28);extrude(sun,(()=>{const s=new T.Shape();s.absarc(0,0,.32,0,Math.PI*2,false);return s;})(),.02,'#f6b25c',0,0,0,{emissive:'#f39a4a',emissiveIntensity:.8,outline:'none'}).userData.keepColor=true;const sunGlow=glow(sun,'#ffb066',1.8,0,0,.05,.6);
 const skyline=extrude(p,skylineShape(),.04,'#5a5d8f',0,0,WALL_Z-.22,{strength:.5});
 const roofWindows=[[-1.05,1.25],[-.75,1.12],[-.45,1.4],[.25,1.18],[.62,1.05],[.95,1.1]].map(([x,y])=>{const m=new T.Mesh(new T.PlaneGeometry(.07,.09),new T.MeshBasicMaterial({color:'#ffd27a'}));m.position.set(CX+x,y,WALL_Z-.195);m.userData.keepColor=true;p.add(m);return m;});
 const moon=group(p,CX+.55,2.7,WALL_Z-.26);extrude(moon,crescent(),.03,'#f3e5a8',0,0,0,{emissive:'#efe0a0',emissiveIntensity:.45,outline:'none'}).userData.keepColor=true;const moonGlow=glow(moon,'#e9e4ff',1.1,0,0,-.02,.45);
 const stars=Array.from({length:14},(_,i)=>{const g=group(p,CX-1.0+((i*.61)%1)*2.0,1.85+((i*.37)%1)*1.15,WALL_Z-.27);const m=extrude(g,starShape(.05+(i%3)*.012),.01,'#fff3c4',0,0,0,{emissive:'#fff3c4',emissiveIntensity:.7,outline:'none'});m.userData.keepColor=true;return g;});
 // The wall with an arched window, frame, sill and a pair of hanging curtains.
 extrude(p,wallShape(),.12,'#f2ede4',0,0,WALL_Z);
 box(p,.05,2.2,.08,PAPER,CX,2.07,WALL_Z+.02);for(const y of [1.55,2.1])box(p,2.3,.05,.08,PAPER,CX,y,WALL_Z+.02);
 const arc=solid(p,new T.TorusGeometry(1.13,.03,8,48,Math.PI),PAPER,[CX,2.0,WALL_Z+.02],{outline:'hull',hull:.006});arc.rotation.z=0;
 solid(p,new T.TorusGeometry(.58,.025,8,36,Math.PI),PAPER,[CX,2.0,WALL_Z+.02],{outline:'hull',hull:.006});
 box(p,2.75,.08,.42,PAPER,CX,.97,WALL_Z+.22);
 const curtains=[-1,1].map((side,i)=>{const g=group(p,CX+side*1.42,3.2,WALL_Z+.3);const geo=new T.PlaneGeometry(.55,2.3,18,1);const pos=geo.attributes.position as T.BufferAttribute;for(let k=0;k<pos.count;k++)pos.setZ(k,Math.sin(pos.getX(k)*24+i)*.045);geo.computeVertexNormals();const m=solid(g,geo,'#e7dff2',[0,-1.15,0],{threshold:18,strength:.9});(m.material as T.Material).side=T.DoubleSide;return g;});
 // A sleeping cat on the sill.
 const cat=group(p,CX-.78,1.01,WALL_Z+.24);const body=sphere(cat,.2,'#ebe7ef',0,.11,0,{hull:.007});body.scale.set(1.35,.62,.85);sphere(cat,.1,'#ebe7ef',.25,.12,.04,{hull:.006});
 for(const z of [-.04,.07])cyl(cat,0,.035,.07,'#ebe7ef',.28,.22,z,{hull:.004});tube(cat,[[-.25,.06,.02],[-.3,.04,.14],[-.12,.03,.2],[.08,.03,.18]],.022,'#ebe7ef',{hull:.005});
 // Desk with legs and apron.
 const desk=group(p,-.2,0,-1.85);box(desk,3.2,.08,1.2,PAPER,0,.9,0);box(desk,3.0,.14,1.05,PAPER,0,.79,0);
 for(const [x,z] of [[-1.48,-.5],[1.48,-.5],[-1.48,.5],[1.48,.5]])cyl(desk,.04,.028,.86,PAPER,x,.43,z,{hull:.007});
 const top=.94;
 // Candle (choice 0): holder, wax, wick, flame, glow and a real warm light.
 const candle=group(p,.55,top,-1.75,0);
 lathe(candle,[[0,0],[.17,0],[.18,.02],[.07,.05],[.045,.12],[.11,.16],[.11,.18],[.065,.18],[0,.18]],'#efe2bf');
 cyl(candle,.048,.05,.36,'#fbf6ea',0,.36,0,{hull:.006});cyl(candle,.006,.006,.04,INK,0,.56,0,{outline:'none'});
 const flame=group(candle,0,.58,0);const flameMesh=new T.Mesh(new T.LatheGeometry([[0,0],[.03,.018],[.036,.05],[.022,.09],[0,.13]].map(([r,y])=>new T.Vector2(r,y)),24),new T.MeshStandardMaterial({color:'#ffd27a',emissive:'#ff9a3c',emissiveIntensity:2.2}));flameMesh.userData.keepColor=true;flame.add(flameMesh);
 const flameGlow=glow(candle,'#ffb24a',1.7,0,.65,0,.7);const lamp=new T.PointLight('#ffb361',0,6,2);lamp.position.set(0,.7,0);candle.add(lamp);
 const smoke=ribbon(candle,[[0,.6,0],[.05,.9,.03],[-.06,1.2,0],[.05,1.5,-.03],[-.02,1.8,0]],'#a9a4b8',{width:.04,twist:2.5});
 // Cup with steam, and the open notebook where the poem is written.
 const cup=group(p,1.15,top,-1.45);lathe(cup,[[0,0],[.12,0],[.14,.02],[.15,.2],[.16,.22],[.14,.22],[.13,.04],[0,.04]],'#dcd6f0');
 const cupHandle=solid(cup,new T.TorusGeometry(.06,.016,8,20,Math.PI),'#dcd6f0',[.15,.12,0],{outline:'hull',hull:.005});cupHandle.rotation.z=-Math.PI/2;
 const steam=ribbon(p,[[1.15,top+.24,-1.45],[1.2,top+.5,-1.42],[1.1,top+.78,-1.48],[1.18,top+1.05,-1.44]],'#f3a670',{width:.05,twist:2.5});
 const book=group(p,-.75,top,-1.6,1);
 const pageL=box(book,.68,.03,.92,PAPER,-.35,.03,0);pageL.rotation.z=.07;
 const nbCanvas=document.createElement('canvas');nbCanvas.width=512;nbCanvas.height=692;const nb=nbCanvas.getContext('2d')!;const nbTex=new T.CanvasTexture(nbCanvas as HTMLCanvasElement);nbTex.colorSpace=T.SRGBColorSpace;
 const pageR=new T.Mesh(new T.BoxGeometry(.68,.03,.92),[paperSide(),paperSide(),new T.MeshStandardMaterial({map:nbTex,roughness:.95}),paperSide(),paperSide(),paperSide()]);pageR.position.set(.35,.03,0);pageR.rotation.z=-.07;pageR.castShadow=pageR.receiveShadow=true;pageR.userData.keepColor=true;book.add(pageR);
 box(book,1.44,.02,.98,'#d9cfe8',0,.008,0);
 const pen=tube(p,[[-1.55,top+.03,-1.35],[-1.05,top+.03,-1.15]],.018,'#4a4f8f',{hull:.004});pen.userData.keepColor=true;
 const clock=card(p,['3:00','am'],{w:.62,h:.42,x:-1.65,y:top+.2,z:-1.55,ry:.35,rx:-.1});
 // Word cards (choice 1): they rise from the notebook and arrange into the chosen poem.
 const words=['light','home','begin'].map((w,i)=>{const g=group(p,0,0,0,i===1?1:i===0?0:2);const cd=card(g,[w],{w:.62,h:.36,accent:c.colors[i]});return {g,cd};});
 words.forEach(({g},i)=>g.userData.pick=i);
 const rings=waves(p,c.accent,{count:3,size:.6});
 // Stores: dark, lamp, morning.
 const rack=jarRack(p,c.stores.map((label,i)=>({label,color:c.colors[i]})),{x:2.2,z:-1.15,ry:-.95,spacing:.6,r:.2,h:.66});
 let drawnKey='';
 const drawPoem=(choice:number,lines:number)=>{const fontReady=(globalThis.document as Document&{fonts?:FontFaceSet})?.fonts?.check?.(`700 54px ${HAND}`)??false;const key=`${choice}|${lines}|${fontReady}`;if(key===drawnKey)return;drawnKey=key;
  nb.fillStyle='#fdfaf2';nb.fillRect(0,0,512,692);nb.strokeStyle='rgba(108,104,191,.25)';nb.lineWidth=2;for(let y=120;y<692;y+=64){nb.beginPath();nb.moveTo(40,y);nb.lineTo(472,y);nb.stroke();}
  const [title,...rest]=c.details[choice].split('\n');nb.fillStyle=INK;nb.font=`700 54px ${HAND}`;nb.fillText(title,50,100);nb.font=`500 46px ${HAND}`;rest.slice(0,Math.max(0,lines-1)).forEach((l,i)=>nb.fillText(l,50,178+i*64,420));nbTex.needsUpdate=true;};
 const tmp=new T.Color(),night=[new T.Color('#141a45'),new T.Color('#353b78')],dawn=[new T.Color('#a9bfeb'),new T.Color('#f7c79c')];
 return {
  sun:s=>{const a=s.amount/100;return [mix(-1.5,-.6,a),mix(10,2.4,a),mix(-5,-9.5,a)];},
  update(s,time){
   const a=clamp01(s.amount/100),day=ease(segment(a,.15,.95)),pr=s.progress;
   const col=skyGeo.attributes.color as T.BufferAttribute;[0,1,2,3].forEach(i=>{const k=i<2?0:1;tmp.copy(night[k]).lerp(dawn[k],day);col.setXYZ(i,tmp.r,tmp.g,tmp.b);});col.needsUpdate=true;
   (skyline.material as T.MeshStandardMaterial).color.set('#5a5d8f').lerp(new T.Color('#c4b3bd'),day);
   roofWindows.forEach((w,i)=>w.visible=a<.45+i*.05);
   moon.position.set(CX+.55-a*.4,mix(2.75,1.2,ease(segment(a,0,.75))),WALL_Z-.26);moon.visible=a<.78;(moonGlow.material as T.SpriteMaterial).opacity=.45*(1-day);
   stars.forEach((g,i)=>{g.visible=a<.32+(i%5)*.06;g.scale.setScalar(.8+.25*Math.sin(time*2.2+i*1.7));});
   sun.position.y=mix(.75,1.75,ease(segment(a,.5,1)));sun.visible=a>.5;(sunGlow.material as T.SpriteMaterial).opacity=.6*segment(a,.5,.8);
   curtains.forEach((g,i)=>g.rotation.x=Math.sin(time*.6+i*1.3)*.025);body.scale.y=.62*(1+.035*Math.sin(time*1.6));
   // The candle: lit by the toggle, or by the story (lit in step 1, out again as morning comes).
   const storyLit=s.step===0?pr>.34:s.step===1?true:pr<.4;const lit=s.alternate||(storyLit&&a<.85);
   flame.visible=lit;flame.scale.set(1+.06*Math.sin(time*17),1+.14*Math.sin(time*13)+.06*Math.sin(time*29),1);flame.rotation.z=.08*Math.sin(time*7);
   flameGlow.visible=lit;(flameGlow.material as T.SpriteMaterial).opacity=.55+.12*Math.sin(time*11);lamp.intensity=lit?2.4*(1+.1*Math.sin(time*13)):0;
   const smoking=!lit&&s.step===2&&pr>.4;if(smoking){const h=segment(pr,.4,.85)+((time*.2)%.3);smoke.set(h,h-.6);}else smoke.set(0,0);
   const sh=((time*.3)%1.3);steam.set(sh,sh-.5);
   // Word cards: resting on the notebook, then floating, then the chosen one comes forward.
   const rise=s.step===0?0:s.step===1?ease(segment(pr,0,.32)):1,arrange=s.step===0?0:s.step===1?ease(segment(pr,.34,.62)):1;
   words.forEach(({g},i)=>{const rest:V3=[-.95+i*.2,top+.07+i*.012,-1.35+i*.05];const float:V3=[CX+(i-1)*.9,1.85+(i===1?.18:0),-1.55];const chosen=i===s.choice;
    const out:V3=chosen?[CX,2.05,-1.1]:[CX+(i-s.choice>0?1:-1)*1.05+(i-1)*.1,2.25,-1.9];
    const pos=[0,1,2].map(k=>mix(mix(rest[k],float[k],rise),out[k],arrange)) as V3;
    g.position.set(pos[0],pos[1]+(rise>0?Math.sin(time*1.4+i)*.04:0)+(chosen&&rise===0?.06:0),pos[2]);
    g.rotation.set(mix(-Math.PI/2+.25,0,rise),mix(.15*(i-1),0,rise),rise===0&&chosen?.12:0);g.scale.setScalar(chosen?mix(1,1.3,arrange):mix(1,.85,arrange));});
   const target=words[s.choice].g.position;rings.group.position.set(target.x,target.y,target.z-.05);rings.update(time,rise>0?1:.5);
   setTint(book,violet,s.choice===1?.25:0);
   drawPoem(s.choice,s.step===1?Math.floor(segment(pr,.62,.95)*4.99):4);
   const mins=180+Math.round(a*220);clock.set([`${Math.floor(mins/60)}:${String(mins%60).padStart(2,'0')}`,'am']);
   const lampLevel=s.alternate?.82:s.step===0?.08+.7*ease(segment(pr,.34,.6)):s.step===1?.78:.78-.7*ease(segment(pr,.38,.7));
   const lv=[1-a*.95,lampLevel,a];rack.set(lv,lv.map(v=>`${Math.round(v*100)}%`));
  },
  camera(s){const t=s.progress;
   if(s.step===0)return shotPath(t,[[0,shot([.5,3.6,8.6],[-.1,1.6,-1.3])],[.34,shot([1.15,1.65,1.9],[.55,1.25,-1.75])],[.67,shot([-1.4,1.9,3.3],[-.1,1.45,-1.4])]]);
   if(s.step===1)return shotPath(t,[[0,shot([.2,2.4,3.5],[-.45,1.3,-1.4])],[.34,shot([-1.3,2.1,3.1],[CX,1.95,-1.4])],[.67,shot([-.4,2.2,1.4],[-.6,1.0,-1.6])]]);
   return shotPath(t,[[0,shot([0,2.0,3.7],[CX,2.15,-2.6])],[.34,shot([1.25,1.55,2.0],[.55,1.25,-1.75])],[.67,shot([.6,4.0,9.2],[-.1,1.5,-1.2])]]);
  }
 };
}
function paperSide(){return new T.MeshStandardMaterial({color:PAPER,roughness:1});}
