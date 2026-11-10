export const compileSource=`
import {applyMotionTransaction} from '@/motion/engine/motion-document';
import {makeOp} from '@/motion/host/operations';
import {validateMotionOps} from '@/motion/host/validation';
import {layoutSegments} from '@/motion/spatial/typography';
async function compileDescriptor(desc){
 await window.golden.ready;await document.fonts.ready;
 const doc=createMotionDocument(desc.id,{value:desc.frames,timescale:30},30,1080,1920);doc.id=desc.id;doc.createdAt=0;doc.updatedAt=0;
 const project={format:'cutlab-motion-project',version:1,id:desc.id,name:desc.id,fps:30,width:1080,height:1920,duration:doc.duration,assets:{},motionDocuments:{[doc.id]:doc},activeDocumentId:doc.id,createdAt:0,updatedAt:0};
 const ops=[],words=[];
 const add=(object)=>ops.push(makeOp('motion.object.add',doc.id,{object}));
 const build=(o)=>({...createObject(o.kind,o.id),...o,transform:{...DEFAULT_MOTION_TRANSFORM,...o.transform}});
 for(const m of desc.materials)ops.push(makeOp('motion.material.upsert',doc.id,{material:m}));
 for(const o of desc.objects){
  if(o.kind!=='word_group'){add(build(o));continue;}
  const group=build({id:o.id,kind:'group',name:o.id,parentId:o.parentId,transform:o.transform});add(group);
  const base={text:o.text,fontFamily:'IBM Plex Sans',fontSize:o.fontSize,fontWeight:600,textAlign:'center',lineHeight:1.2};
  const segments=layoutSegments(base,'word');
  if(!segments.length||segments.some(w=>w.text.trim().split(/\\s+/).length!==1))throw new Error('FORBIDDEN_OP: unsplit recipe text');
  segments.forEach((w,i)=>{
   const id=o.id+'_w'+i,start=o.start+i*o.stagger,end=o.end,finish=start+o.entrance;
   if(finish>=end)throw new Error('OUT_OF_BOUNDS: word hold');
   const child=build({...base,id,kind:'text',name:id,text:w.text,parentId:o.id,sourceTokenId:id+':0',materialId:'ink',transform:{x:w.x,y:w.y}});
   const k=(property,frame,value)=>({id:id+'_'+property+'_'+frame,property,time:{value:frame,timescale:30},value,easing:'linear'});
   child.keyframes=[k('opacity',start,0),k('opacity',finish,1),k('y',start,w.y+10),k('y',finish,w.y)];
   if(end<desc.frames)child.keyframes.push(k('opacity',end-1,1),k('opacity',end,0));
   add(child);words.push({id,text:w.text,start:finish,end,rise:10});
  });
 }
 for(const c of desc.cameras)ops.push(makeOp('motion.camera.upsert',doc.id,{camera:{...c,transform:{...DEFAULT_MOTION_TRANSFORM,...c.transform}}}));
 validateMotionOps(project,ops);project.motionDocuments[doc.id]=applyMotionTransaction(doc,{ops,description:'Foundry recipe compile'});
 return JSON.parse(JSON.stringify({project:parseProject(project),meta:{...desc,words},ops}));
}
`;
