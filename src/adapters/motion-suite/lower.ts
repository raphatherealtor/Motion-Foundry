import {OperationV2} from './v2.js';
import type {Compiled} from './compile.js';
const memberObjects=(doc:any,id:string)=>{const out:any[]=[];function walk(i:string){const o=doc.objects[i];if(!o)throw new Error('FORBIDDEN_OP: object missing');if(o.keyframes?.length)out.push(o);for(const c of o.childIds||[])walk(c);}walk(id);return out;};
export function lowerOperation(c:Compiled,op:OperationV2){
 const doc=c.project.motionDocuments[c.project.activeDocumentId],native:any[]=[],emit=(type:string,payload:any)=>native.push({type,documentId:doc.id,payload});
 if(op.target.startsWith('lighting.')){emit('motion.lighting.setProps',{props:{[op.target.split('.')[1]]:op.value}});return native;}
 const [,id,group,key]=op.target.split('.'),o=doc.objects[id];
 if(op.op==='set'){
  if(group==='transform'){const property=key==='rotation'?'rotationZ':key;emit('motion.object.setTransform',{objectId:id,transform:key==='scale'?{scaleX:op.value,scaleY:op.value}:{[property]:op.value}});}
  else if(group==='surface')emit('motion.object.setProps',{objectId:id,props:{surface:{receivesLight:false,...o.surface,[key]:op.value}}});
  else emit('motion.object.setProps',{objectId:id,props:{[group==='layout'?'textAlign':key]:op.value}});
  return native;
 }
 for(const member of memberObjects(doc,id)){
  const word=c.meta.words.find(w=>w.id===member.id),keys=word?member.keyframes.filter((k:any)=>k.time.value<=word.start):member.keyframes;
  for(const k of keys){
   if(op.op==='set_easing'){
    if(member.kind==='text'&&op.value==='hold')throw new Error('FORBIDDEN_OP: text entrance must fade');
    emit('motion.keyframe.setEasing',{objectId:member.id,keyframeId:k.id,easing:op.value});
   }else{
    const frame=k.time.value+op.value;
    if(frame<0||frame>=c.meta.frames)throw new Error('OUT_OF_BOUNDS: shifted keyframe');
    emit('motion.keyframe.move',{objectId:member.id,keyframeId:k.id,newTime:{value:frame,timescale:30}});
   }
  }
  if(word&&op.op==='shift_keyframes'){word.start+=op.value;if(word.start<0||word.start>=word.end)throw new Error('OUT_OF_BOUNDS: word hold');}
 }
 return native;
}
