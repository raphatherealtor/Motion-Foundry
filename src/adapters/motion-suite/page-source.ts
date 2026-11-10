// Import the product harness and canonical constructors; no renderer implementation is copied.
export function pageSource(checkout:string){return `
import ${JSON.stringify(checkout+'/tests/golden/page/main.ts')};
import {parseProject} from '@/motion/host/persistence';
import {createMotionDocument} from '@/motion/engine/motion-document';
import {createObject} from '@/motion/host/operations';
window.foundryMS={
 parse: input=>parseProject(structuredClone(input)),
 synthetic: ()=>{
  const d=createMotionDocument('Foundry synthetic',{value:180,timescale:30},30,1080,1920);
  d.id='foundry-synthetic';d.createdAt=0;d.updatedAt=0;d.backgroundColor='#ede7d9';
  const bar=createObject('shape','bar');bar.id='bar';bar.shapeType='rectangle';bar.shapeFillColor='#e65335';bar.transform.x=-180;bar.transform.y=180;bar.transform.scaleX=3;bar.transform.scaleY=5;
  bar.keyframes=[{id:'bar-y0',time:{value:0,timescale:30},property:'y',value:260,easing:'linear'},{id:'bar-y1',time:{value:90,timescale:30},property:'y',value:180,easing:'linear'}];
  const text=createObject('text','headline');text.id='headline';text.text='Foundry';text.fontFamily='IBM Plex Sans';text.fontSize=100;text.transform.y=-500;
  d.objects={bar,headline:text};d.rootObjectIds=['bar','headline'];
  return parseProject({format:'cutlab-motion-project',version:1,id:'foundry-synthetic-project',name:d.name,fps:30,width:d.width,height:d.height,duration:d.duration,assets:{},motionDocuments:{[d.id]:d},activeDocumentId:d.id,createdAt:0,updatedAt:0});
 }
};
`;}
