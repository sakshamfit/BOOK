import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {GET,POST} from '../app/api/store/route';
import {env} from './runtime-stub';
const sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON;');sqlite.exec(readFileSync('drizzle/0000_famous_donald_blake.sql','utf8'));
class Statement{values:any[]=[];constructor(public sql:string){}bind(...v:any[]){this.values=v;return this;}async all(){return {results:sqlite.prepare(this.sql).all(...this.values)};}async first(){return sqlite.prepare(this.sql).get(...this.values)||null;}async run(){const r=sqlite.prepare(this.sql).run(...this.values);return {meta:{changes:Number(r.changes)}};}}
env.DB={prepare:(s:string)=>new Statement(s),batch:async(statements:Statement[])=>{sqlite.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());sqlite.exec('COMMIT');return result;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};env.ADMIN_USER_IDS='owner';
const req=(body:any,id='owner',origin='https://folio.test')=>new Request('https://folio.test/api/store',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,...(id?{'oai-authenticated-user-id':id,'oai-authenticated-user-email':id+'@example.test'}:{})},body:JSON.stringify(body)});
const get=(action:string,id='')=>GET(new Request('https://folio.test/api/store?action='+action,{headers:id?{'oai-authenticated-user-id':id}:{}}));
test('Store API authorization, durable editing, account isolation, checkout, and webhook',async()=>{
 assert.equal((await get('admin')).status,403);assert.equal((await get('admin','reader')).status,403);
 assert.equal((await POST(req({action:'initialize'},'owner','https://evil.test'))).status,403);
 assert.equal((await POST(req({action:'initialize'},'reader'))).status,403);
 assert.equal((await POST(req({action:'join'},''))).status,401);
 assert.equal((await POST(req({action:'initialize'}))).status,200);
 const catalog:any=await (await get('catalog')).json();assert.equal(catalog.books.length,8);assert.equal(catalog.initialized,true);
 assert.equal((await POST(req({action:'saveBook',book:{...catalog.books[0],stock:1,title:'A real test edition',demo:false}}))).status,200);
 const updated:any=await (await get('catalog')).json();assert.equal(updated.books.find((b:any)=>b.id===catalog.books[0].id).title,'A real test edition');
 assert.equal((await POST(req({action:'saveAuthor',author:{...catalog.authors[0],bio:'A persisted biography.'}}))).status,200);
 const authorData:any=await (await get('catalog')).json();assert.equal(authorData.authors[0].bio,'A persisted biography.');
 await POST(req({action:'join'},'reader'));await POST(req({action:'shelf',ids:['noticing']},'reader'));
 const account:any=await (await get('account','reader')).json();const other:any=await (await get('account','different')).json();assert.equal(account.member,true);assert.deepEqual(account.shelf,['noticing']);assert.deepEqual(other.shelf,[]);assert.equal(other.member,false);
 const cart={action:'checkout',key:crypto.randomUUID(),items:[{id:'noticing',quantity:1,price:1}]};assert.equal((await POST(req(cart,'reader'))).status,503);
 env.STRIPE_SECRET_KEY='sk_test_mock';env.STRIPE_WEBHOOK_SECRET='whsec_mock';await POST(req({action:'saveSettings',settings:{...catalog.settings,commerceEnabled:true}}));
 let providerCalls=0;let sentPrice='';const originalFetch=globalThis.fetch;globalThis.fetch=async(url:any,init:any)=>{assert.equal(String(url),'https://api.stripe.com/v1/checkout/sessions');providerCalls++;sentPrice=new URLSearchParams(init.body).get('line_items[0][price_data][unit_amount]')||'';return Response.json({id:'cs_mock',url:'https://checkout.stripe.com/c/pay/test-mock'});};
 try{
 const check=await POST(req(cart,'reader'));assert.equal(check.status,200);const checkout:any=await check.json();assert.equal(providerCalls,1);assert.equal(sentPrice,'2400');
 assert.equal((await POST(req(cart,'reader'))).status,200);assert.equal(providerCalls,1);
 assert.equal((await POST(req({...cart,key:crypto.randomUUID()},'reader2'))).status,400);
 assert.equal(sqlite.prepare("SELECT stock FROM products WHERE id='noticing'").get()?.stock,0);
 const event={type:'checkout.session.completed',data:{object:{id:'cs_mock',metadata:{order_id:checkout.orderId},payment_status:'paid',amount_total:2890,currency:'eur',customer_details:{name:'Test reader',email:'reader@example.test'}}}};
 const payload=JSON.stringify(event),now=Math.floor(Date.now()/1000);const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.STRIPE_WEBHOOK_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);const signed=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(now+'.'+payload));const signature=Array.from(new Uint8Array(signed),b=>b.toString(16).padStart(2,'0')).join('');
 const webhook=()=>new Request('https://folio.test/api/store?action=webhook',{method:'POST',headers:{'Stripe-Signature':`t=${now},v1=${signature}`},body:payload});
 assert.equal((await POST(webhook())).status,200);assert.equal((await POST(webhook())).status,200);assert.equal(sqlite.prepare('SELECT status FROM orders WHERE id=?').get(checkout.orderId)?.status,'paid');
 assert.equal((await POST(req({action:'fulfill',id:checkout.orderId},'reader'))).status,403);assert.equal((await POST(req({action:'fulfill',id:checkout.orderId}))).status,200);
 assert.equal((await POST(req({action:'orderStatus',id:checkout.orderId},'different'))).status,404);
 }finally{globalThis.fetch=originalFetch;}
});
