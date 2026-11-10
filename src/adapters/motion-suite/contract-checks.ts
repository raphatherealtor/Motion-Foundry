import {hash} from '../../hash.js';
import type {MotionScene} from '../../recipes/types.js';
import type {Compiled} from './compile.js';
export function protectedViolations(scene:MotionScene,c:Compiled,base:Compiled){
 const current=c.project.motionDocuments[c.project.activeDocumentId],original=base.project.motionDocuments[base.project.activeDocumentId],bad:Record<string,unknown>[]=[];
 for(const id of scene.protected){
  const select=(p:any,d:any)=>d.objects[id]??p.assets[id]??Object.values(d.objects).flatMap((o:any)=>o.masks||[]).find((m:any)=>m.id===id);
  const a=select(base.project,original),b=select(c.project,current);
  if(!a||!b||hash(a)!==hash(b))bad.push({object:id,detail:'Protected object, mask or asset changed'});
 }
 const order=(d:any)=>d.rootObjectIds.filter((id:string)=>scene.protected.includes(id));
 if(hash(order(original))!==hash(order(current)))bad.push({detail:'Protected relative order changed'});
 return bad;
}
export function tearViolations(c:Compiled){
 const bad:Record<string,unknown>[]=[],doc=c.project.motionDocuments[c.project.activeDocumentId];
 for(let i=0;i<c.meta.edges.length;i++){
  const e=c.meta.edges[i],prev=c.meta.edges[i-1],o=doc.objects[e.id];
  if(prev&&(prev.seed===e.seed||prev.path===e.path))bad.push({object:e.id,detail:'Consecutive tear seed or path repeated'});
  if(!o?.masks?.some((m:any)=>m.pathData===e.path))bad.push({object:e.id,detail:'Seeded edge geometry changed'});
 }
 return bad;
}
export function anchorViolations(c:Compiled){
 const doc=c.project.motionDocuments[c.project.activeDocumentId];
 return c.meta.anchors.flatMap(a=>{
  const object=doc.objects[a.object],keys=object?.keyframes||[];
  const actual=keys.length?Math.max(...keys.map((k:any)=>k.time.value*30/k.time.timescale)):NaN;
  return !Number.isInteger(actual)||!Number.isInteger(a.word_frame)||a.word_frame-actual<0||a.word_frame-actual>6?[{...a,actual_frame:actual,detail:'Landing must be on word or at most0.2s before;0.5s absolute cap'}]:[];
 });
}
