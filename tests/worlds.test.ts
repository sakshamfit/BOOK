import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {renderToStaticMarkup} from 'react-dom/server';
import React from 'react';
import {books} from '../lib/catalog';
import {concepts,conceptFor,initialWorldState} from '../lib/worlds/concepts';
import {conceptBuilders} from '../lib/worlds/engine';
import WorldFallback from '../components/worlds/WorldFallback';
// The models construct textures but do not need a GPU to verify their geometry and controls.
const context=new Proxy({}, {get:(_,key)=>key==='measureText'?(s:string)=>({width:s.length*12}):()=>{},set:()=>true});
Object.assign(globalThis,{document:{createElement:()=>({width:0,height:0,getContext:()=>context})}});
function snapshot(root:THREE.Object3D){const values:unknown[]=[];root.traverse(o=>{const m=o as THREE.Mesh;values.push(o.visible,o.position.toArray(),o.rotation.toArray(),o.scale.toArray());if(m.material instanceof THREE.MeshStandardMaterial)values.push(m.material.color.toArray(),m.material.emissive.toArray());});return JSON.stringify(values);}
function make(id:keyof typeof concepts){const root=new THREE.Group(),concept=concepts[id];return {root,concept,model:conceptBuilders[id](root,concept),state:{...initialWorldState(concept),open:true}};}

test('Every catalog book has its own complete, valid three-step concept',()=>{
 assert.deepEqual(books.map(b=>b.id).sort(),Object.keys(concepts).sort());assert.equal(new Set(Object.values(concepts).map(c=>c.title)).size,8);
 for(const book of books){const c=conceptFor(book.id)!;assert.equal(c.steps.length,3);assert.equal(c.choices.length,3);assert.equal(c.details.length,3);for(const step of c.steps){assert.ok(step.amount>=c.range.min&&step.amount<=c.range.max);assert.ok(c.choices[step.choice]);assert.ok(step.text.length>40&&step.prompt.length>10);}assert.ok(c.range.start>=c.range.min&&c.range.start<=c.range.max);}
 assert.equal(conceptFor('no-such-book'),undefined);
});
test('All eight models support finite geometry, selection, and their distinct controls',()=>{
 for(const id of Object.keys(concepts) as (keyof typeof concepts)[]){const {root,model,state,concept}=make(id);model.update(state,0);const before=snapshot(root);model.update({...state,choice:1},0);assert.notEqual(snapshot(root),before,`${id}: object choice must change the model`);model.update({...state,amount:concept.range.max,choice:2,alternate:true},0);root.traverse(o=>{for(const n of [...o.position.toArray(),...o.scale.toArray(),o.rotation.x,o.rotation.y,o.rotation.z])assert.ok(Number.isFinite(n),`${id}: finite transform`);});const varied=snapshot(root);model.update({...state,amount:concept.range.min,choice:2,alternate:false},0);assert.notEqual(snapshot(root),varied,`${id}: controls must alter the scene`);}
});
test('A one-object gallery retains the selected form',()=>{const {root,model,state}=make('silence');model.update({...state,amount:1,choice:2},0);const forms=root.children.filter(o=>typeof o.userData.pick==='number'&&o.visible);assert.equal(forms.length,1);assert.equal(forms[0].userData.pick,2);});
test('Train and walker movement is frame-rate independent and holds with a frozen clock',()=>{
 for(const id of ['train','atlas'] as const){const a=make(id),b=make(id);a.state.playing=b.state.playing=true;a.model.update(a.state,0);b.model.update(b.state,0);for(let i=1;i<=30;i++)a.model.update(a.state,i/30);for(let i=1;i<=120;i++)b.model.update(b.state,i/120);const apos:THREE.Vector3[]=[],bpos:THREE.Vector3[]=[];a.root.traverse(o=>apos.push(o.position));b.root.traverse(o=>bpos.push(o.position));apos.forEach((p,i)=>assert.ok(p.distanceTo(bpos[i])<1e-8));const held=snapshot(a.root);for(let i=0;i<60;i++)a.model.update(a.state,1);assert.equal(snapshot(a.root),held,'Reduced-motion clock must hold the model');}
});
test('Each illustrated fallback renders its distinct scene and accessible description',()=>{
 const scenes=new Set<string>();for(const c of Object.values(concepts)){const markup=renderToStaticMarkup(React.createElement(WorldFallback,{concept:c,state:{...initialWorldState(c),open:true}}));assert.match(markup,/<svg/);assert.match(markup,/aria-label=/);assert.ok(!markup.includes('NaN'));scenes.add(markup);}assert.equal(scenes.size,8);
});
