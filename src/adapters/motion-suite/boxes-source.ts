// Browser module source: all geometry and evaluated transforms come from the pinned product.
export const boxesSource=`
import {buildSpatialFrame,projectedCorners,depthAtmosphere} from '@/motion/render/spatialProjection';
import {objectBounds} from '@/motion/render/geometry';
async function wordBoxes(project,frameNumber){
 await strictPrepare(project);
 const doc=project.motionDocuments[project.activeDocumentId],frame=buildSpatialFrame(doc,frameNumber/30);
 const ctx=document.createElement('canvas').getContext('2d'),objects=[],words=[],unsupported=[];
 for(const plane of frame.planes){
  const id=plane.state.objectId,o=frame.document.objects[id];
  if(!['text','text-segment','shape','image','svg','html'].includes(o.kind))continue;
  const corners=projectedCorners(frame,plane,objectBounds(o,project,ctx,true));
  const projected=corners.every(Boolean),points=corners.filter(Boolean);
  const bbox=projected?[Math.min(...points.map(p=>p.x)),Math.min(...points.map(p=>p.y)),Math.max(...points.map(p=>p.x)),Math.max(...points.map(p=>p.y))]:[0,0,0,0];
  const opacity=plane.state.opacity*(o.materialId?frame.document.materials[o.materialId]?.opacity??1:1)*depthAtmosphere(plane).fade;
  const item={object:id,word:o.sourceTokenId||id,text:o.text||'',bbox,opacity,displayed:plane.state.visible,visible:plane.state.visible&&projected&&opacity>.02&&bbox[2]>0&&bbox[3]>0&&bbox[0]<doc.width&&bbox[1]<doc.height,fontSize:o.fontSize||0,projected};
  objects.push(item);
  if(o.kind==='text'||o.kind==='text-segment'){
   if((o.text||'').trim().split(/\\s+/).filter(Boolean).length===1&&!o.textSegments?.length){words.push(item);if(!projected)unsupported.push(id);}
   else if((o.text||'').trim())unsupported.push(id);
  }
 }
 return {frame:frameNumber,words,objects,word_level:{status:unsupported.length?'UNSUPPORTED':words.length?'PASS':'NOT_RUN',unsupported_objects:unsupported}};
}
`;
