import type {Range} from '../../contracts.js';
export interface RationalFrameTime {value:number;timescale:30}
export class TimingError extends Error {
 readonly status='ERROR';
 constructor(readonly reason_code:'TYPE_INVALID'|'FORBIDDEN_OP'|'OUT_OF_BOUNDS',readonly detail:string){super(reason_code+': '+detail);}
}
const invalid=(path:string):never=>{throw new TimingError('TYPE_INVALID','NON_INTEGER_FRAME '+path);};
function object(value:unknown,path:string):Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype)throw new TimingError('TYPE_INVALID','Expected object '+path);
 return value as Record<string,unknown>;
}
export function rationalToFrame(time:unknown,path='time'):number {
 const t=object(time,path);
 if(Object.keys(t).some(k=>k!=='value'&&k!=='timescale'))throw new TimingError('TYPE_INVALID','Unexpected rational property '+path);
 if(!Number.isSafeInteger(t.value)||!Number.isSafeInteger(t.timescale)||(t.value as number)<0||(t.timescale as number)<=0)return invalid(path);
 const numerator=BigInt(t.value as number)*30n,denominator=BigInt(t.timescale as number);
 if(numerator%denominator!==0n)return invalid(path);
 const frame=numerator/denominator;
 if(frame>BigInt(Number.MAX_SAFE_INTEGER))return invalid(path);
 return Number(frame);
}
export function frameTime(frame:number,path='frame'):RationalFrameTime {
 if(!Number.isSafeInteger(frame)||frame<0)return invalid(path);
 return {value:frame,timescale:30};
}
export function assertNoFpsChange(operation:{target?:unknown}){
 if(typeof operation.target==='string'&&/(^|\.)fps$/.test(operation.target))throw new TimingError('FORBIDDEN_OP','FPS is pinned to 30/1');
}
function timedMembers(node:Record<string,unknown>,path:string){
 for(const [key,fields] of [['keyframes',['time']],['behaviors',['startTime','duration']],['textSegments',['startTime','endTime']]] as const){
  if(!(key in node))continue;
  if(!Array.isArray(node[key]))throw new TimingError('TYPE_INVALID','Expected array '+path+'.'+key);
  for(const [i,item] of (node[key] as unknown[]).entries()){
   const p=path+'.'+key+'['+i+']',member=object(item,p);
   for(const field of fields)rationalToFrame(member[field],p+'.'+field);
  }
 }
}
function normalizedTree(value:unknown,path:string,seen:Set<object>):unknown {
 if(!value||typeof value!=='object')return value;
 if(seen.has(value))throw new TimingError('TYPE_INVALID','Cyclic project '+path);
 seen.add(value);
 try{
  if(Array.isArray(value))return value.map((v,i)=>normalizedTree(v,path+'['+i+']',seen));
  const node=object(value,path);
  if('timescale' in node)return frameTime(rationalToFrame(node,path),path);
  timedMembers(node,path);
  return Object.fromEntries(Object.entries(node).map(([k,v])=>[k,normalizedTree(v,path+'.'+k,seen)]));
 }finally{seen.delete(value);}
}
export function normalizeProjectTiming<T>(input:T):T {
 const project=object(input,'project');
 if(project.fps!==30)throw new TimingError('TYPE_INVALID','FPS must be 30/1 at project.fps');
 rationalToFrame(project.duration,'project.duration');
 const docs=object(project.motionDocuments,'project.motionDocuments');
 for(const [id,value] of Object.entries(docs)){
  const path='project.motionDocuments.'+id,doc=object(value,path);
  if(doc.fps!==30)throw new TimingError('TYPE_INVALID','FPS must be 30/1 at '+path+'.fps');
  if(rationalToFrame(doc.duration,path+'.duration')===0)throw new TimingError('OUT_OF_BOUNDS','Empty composition '+path);
 }
 return normalizedTree(input,'project',new Set()) as T;
}
export function compositionFrames(project:unknown):number {
 const p=object(project,'project'),docs=object(p.motionDocuments,'project.motionDocuments');
 const id=p.activeDocumentId;
 if(typeof id!=='string')throw new TimingError('TYPE_INVALID','Missing activeDocumentId');
 return rationalToFrame(object(docs[id],'project.motionDocuments.'+id).duration,'project.motionDocuments.'+id+'.duration');
}
export function assertFrameRange(range:Range,frames:number){
 for(const key of ['start','end'] as const)if(!Number.isSafeInteger(range[key])||range[key]<0)invalid('range.'+key);
 if(range.start>=range.end||range.end>frames)throw new TimingError('OUT_OF_BOUNDS','Expected half-open range inside [0,'+frames+')');
}
