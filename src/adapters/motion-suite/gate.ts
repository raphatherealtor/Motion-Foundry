import type {MotionScene} from '../../recipes/types.js';
import {manifests,checkBlock} from '../../recipes/registry.js';
import {allowlist,OperationV2,checkProposal,ProposalV2} from './v2.js';
import {assertNoFpsChange} from './timing.js';
export const match=(pattern:string,value:string)=>new RegExp('^'+pattern.split('*').map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('[A-Za-z0-9_-]+')+'$').test(value);
export function gateOperation(scene:MotionScene,project:any,op:OperationV2){
 assertNoFpsChange(op);
 const doc=project.motionDocuments[project.activeDocumentId],m=/^objects\.([A-Za-z0-9_-]+)\./.exec(op.target),id=m?.[1];
 if(id){
  if(!Object.hasOwn(doc.objects,id))throw new Error('FORBIDDEN_OP: unknown object');
  for(const protectedId of scene.protected){
   const owners=doc.objects[protectedId]?[protectedId]:(Object.values(doc.objects) as any[]).filter(o=>o.assetRef===protectedId||o.masks?.some((x:any)=>x.id===protectedId)).map(o=>o.id);
   for(let owner of owners)while(owner){if(owner===id)throw new Error('FORBIDDEN_OP: protected object or ancestor');owner=doc.objects[owner]?.parentId;}
  }
 }
 const block=scene.blocks.find(b=>id?id.startsWith(b.id+'_'):op.target.startsWith('blocks.'+b.id+'.')||op.target==='blocks.'+b.id);
 const recipes=block?[manifests[block.recipe]]:scene.blocks.map(b=>manifests[b.recipe]);
 if(!recipes.some(r=>r.allowed_ops.some((r:any)=>r.op===op.op&&match(r.target,op.target))))throw new Error('FORBIDDEN_OP: outside recipe intersection');
 if(op.op==='set'){
  const target=Object.keys(allowlist.rules).find(k=>match(k,op.target));if(!target)throw new Error('FORBIDDEN_OP: unmapped target');
  const rule=allowlist.rules[target],v=op.value;
  if(rule.type==='enum'?!rule.values.includes(v):typeof v!=='number'||!Number.isFinite(v)||rule.type==='integer'&&!Number.isSafeInteger(v))throw new Error('TYPE_INVALID: value type');
  if(typeof v==='number'&&(v<rule.min||v>rule.max))throw new Error('OUT_OF_BOUNDS: '+op.target);
  if(op.target.includes('.text.')&&doc.objects[id!].kind!=='text')throw new Error('FORBIDDEN_OP: not a text word');
 }
 if(op.op==='shift_keyframes'){
  if(!Number.isSafeInteger(op.value))throw new Error('TYPE_INVALID: integer frame shift required');
  if(Math.abs(op.value)>30)throw new Error('OUT_OF_BOUNDS: frame shift');
 }
 if(op.op==='set_stagger')staggerFrames(op.value);
 if(op.op==='set_easing'&&!allowlist.easings.includes(op.value))throw new Error('TYPE_INVALID: easing enum (bezier requires handles and is omitted)');
 if(op.op==='apply_recipe'){
  if(!op.value||Object.keys(op.value).some(k=>!['recipe','params'].includes(k))||!Object.hasOwn(manifests,op.value.recipe))throw new Error('FORBIDDEN_OP: unregistered recipe or raw fields');
  const blockId=op.target.slice('blocks.'.length);
  if(scene.protected.some(id=>id.startsWith(blockId+'_')))throw new Error('FORBIDDEN_OP: protected recipe block');
  checkBlock({id:blockId,...op.value});
 }
}
export function staggerFrames(value:unknown){
 if(typeof value!=='number'||!Number.isFinite(value))throw new Error('TYPE_INVALID: stagger seconds');
 if(value<.15||value>.35)throw new Error('OUT_OF_BOUNDS: stagger');
 const digits=String(value).split('.')[1],num=BigInt(digits),den=10n**BigInt(digits.length);
 if(num*30n%den!==0n)throw new Error('TYPE_INVALID: NON_INTEGER_FRAME stagger');
 return Number(num*30n/den);
}
export function gateProposal(scene:MotionScene,project:any,value:unknown,revision_id:string,render_id:string):ProposalV2 {
 checkProposal(value);
 if(value.base_revision_id!==revision_id||value.base_render_id!==render_id)throw new Error('STALE_BASE');
 const touched=new Set<string>();for(const op of value.ops){if(touched.has(op.target))throw new Error('FORBIDDEN_OP: duplicate target');touched.add(op.target);gateOperation(scene,project,op);}
 return value;
}
