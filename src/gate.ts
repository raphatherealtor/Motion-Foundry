import {Scene} from './scene.js';
import {RepairProposal} from './contracts.js';
import {hash} from './hash.js';
import {fail} from './io.js';
type Rule={type:'integer'|'number'|'boolean'|'enum';min?:number;max?:number;values?:string[]};
export const allowlist:Record<string,Rule>={
 'style.fontSize':{type:'integer',min:40,max:160},'style.letterSpacing':{type:'number',min:-2,max:10},'style.lineHeight':{type:'number',min:0.9,max:1.6},
 'layout.x':{type:'integer',min:0,max:1080},'layout.y':{type:'integer',min:0,max:1920},'layout.maxWidth':{type:'integer',min:200,max:900},'layout.align':{type:'enum',values:['left','center','right']},'layout.wrap':{type:'boolean'},'timing.in':{type:'integer',min:0,max:269},'timing.out':{type:'integer',min:1,max:270}
};
export interface History {hashes:string[];values:Record<string,unknown[]>}
export function gate(base:Scene,render_id:string,p:RepairProposal,history:History):Scene{
 if(p.base_revision_id!==hash(base)||p.base_render_id!==render_id)fail('STALE_BASE');
 if(p.schema!=='foundry.repair_proposal/0.1'||typeof p.rationale!=='string'||!Array.isArray(p.ops)||!p.ops.length)fail('TYPE_INVALID');
 if(Object.keys(p).some(k=>!['schema','base_revision_id','base_render_id','rationale','ops'].includes(k)))fail('FORBIDDEN_OP');
 const next=structuredClone(base);const touched=new Set<string>();
 for(const op of p.ops){
 if(!op||op.op!=='set'||typeof op.target!=='string'||Object.keys(op).some(k=>!['op','target','value'].includes(k)))fail('FORBIDDEN_OP');
 const m=/^objects\.([A-Za-z0-9_-]+)\.(style|layout|timing)\.([A-Za-z]+)$/.exec(op.target);
 if(!m||!Object.hasOwn(base.objects,m[1]))fail('FORBIDDEN_OP');
 const [,id,group,key]=m!,rule=allowlist[group+'.'+key];if(!rule||touched.has(op.target))fail('FORBIDDEN_OP');touched.add(op.target);
 const v=op.value;
 if(rule.type==='boolean'?typeof v!=='boolean':rule.type==='enum'?typeof v!=='string'||!rule.values!.includes(v):typeof v!=='number'||!Number.isFinite(v)||(rule.type==='integer'&&!Number.isInteger(v)))fail('TYPE_INVALID');
 if(typeof v==='number'&&(v<rule.min!||v>rule.max!))fail('OUT_OF_BOUNDS');
 (next.objects[id][group as 'style'] as any)[key]=v;
 }
 for(const [id,o] of Object.entries(next.objects)){
 if(o.timing.in>=o.timing.out)fail('OUT_OF_BOUNDS');
 const prior=base.objects[id];
 if(o.timing.out-o.timing.in<prior.timing.out-prior.timing.in)fail('REQUIRED_CONTENT_LOST');
 }
 if(history.hashes.includes(hash(next)))fail('OSCILLATION');
 for(const target of touched){const [,id,group,key]=target.split('.');const value=(next.objects[id][group as 'style'] as any)[key];const previous=(base.objects[id][group as 'style'] as any)[key];
 const seen=history.values[target]||[previous];if(value!==previous&&seen.includes(value))fail('OSCILLATION');
 }
 return next;
}
export function remember(base:Scene,next:Scene,p:RepairProposal,history:History){history.hashes.push(hash(next));for(const {target} of p.ops){const [,id,group,key]=target.split('.');const prior=(base.objects[id][group as 'style'] as any)[key];const value=(next.objects[id][group as 'style'] as any)[key];history.values[target]??=[prior];if(value!==prior)history.values[target].push(value)}}
