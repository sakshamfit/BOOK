export function normalizeCart(input:unknown):{id:string;quantity:number}[]{
 if(!Array.isArray(input)||input.length===0||input.length>30)throw new Error('Choose between 1 and 30 titles.');
 const seen=new Set<string>();return input.map(item=>{if(!item||typeof item.id!=='string'||!/^[a-z0-9-]{1,80}$/.test(item.id)||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>10||seen.has(item.id))throw new Error('Invalid cart. Each title may have 1–10 copies.');seen.add(item.id);return {id:item.id,quantity:item.quantity};});
}
export function calculateTotals(items:{price:number;quantity:number}[],shipping:number,threshold:number){const subtotal=items.reduce((s,i)=>s+i.price*i.quantity,0);const delivery=subtotal>=threshold?0:shipping;return {subtotal,shipping:delivery,total:subtotal+delivery};}
export async function verifyStripeSignature(payload:string,signature:string,secret:string,now=Math.floor(Date.now()/1000)){
 const parts=signature.split(',').map(s=>s.split('='));const timestamp=parts.find(p=>p[0]==='t')?.[1];const signatures=parts.filter(p=>p[0]==='v1').map(p=>p[1]);
 if(!timestamp||!/^\d+$/.test(timestamp)||Math.abs(now-Number(timestamp))>300)return false;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const result=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(timestamp+'.'+payload));const expected=Array.from(new Uint8Array(result),b=>b.toString(16).padStart(2,'0')).join('');
 return signatures.some(s=>{if(s.length!==expected.length)return false;let diff=0;for(let i=0;i<s.length;i++)diff|=s.charCodeAt(i)^expected.charCodeAt(i);return diff===0;});
}
