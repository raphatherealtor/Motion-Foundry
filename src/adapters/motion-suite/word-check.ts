import type {Compiled} from './compile.js';
import type {MotionSuiteBoxes} from './boxes-types.js';
export function revealViolations(c:Compiled,rows:MotionSuiteBoxes[]){
 const doc=c.project.motionDocuments[c.project.activeDocumentId],bad:Record<string,unknown>[]=[];
 for(const row of rows)if(row.word_level.status!=='PASS')bad.push({frame:row.frame,detail:'Recipe word evidence cannot be skipped',objects:row.word_level.unsupported_objects});
 const text=Object.values(doc.objects).filter((o:any)=>['text','text-segment'].includes(o.kind)) as any[];
 if(text.length!==c.meta.words.length)bad.push({detail:'Missing or extra word objects'});
 for(const word of c.meta.words){
  const o=doc.objects[word.id];
  if(!o||!/^\S+$/.test(o.text)||o.text!==word.text||o.textSegments?.length||o.masks?.length||o.behaviors?.length){bad.push({object:word.id,detail:'Unsplit, masked, segmented or changed text'});continue;}
  let parent=o.parentId;while(parent){const p=doc.objects[parent];if(!p||p.masks?.length||p.keyframes?.some((k:any)=>!['opacity','y'].includes(k.property)))bad.push({object:word.id,detail:'Forbidden parent text animation or mask'});parent=p?.parentId;}
  if((o.tags||[]).some((t:string)=>/character|typewriter|char-pop|projector-sweep|wipe|clip|pen.stroke/.test(t)))bad.push({object:word.id,detail:'Forbidden text preset'});
  const keys=o.keyframes||[],opacity=keys.filter((k:any)=>k.property==='opacity'),y=keys.filter((k:any)=>k.property==='y');
  if(keys.some((k:any)=>!['opacity','y'].includes(k.property))||opacity[0]?.value!==0||opacity[1]?.value!==1||opacity[1]?.time.value!==word.start||y.length!==2||y[0].value-y[1].value<8||y[0].value-y[1].value>12)bad.push({object:word.id,detail:'Entrance must only fade and rise8–12px'});
  for(const r of rows)if(r.frame>=word.start&&r.frame<word.end){const w=r.words.find(w=>w.object===word.id);if(!w||!w.displayed||w.opacity!==1)bad.push({object:word.id,frame:r.frame,detail:'Word not fully opaque at hold'});}
 }
 return bad;
}
