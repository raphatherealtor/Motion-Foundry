export const assetsSource=`
import {getOrCreateImageElement,getOrCreateSvgImageElement} from '@/motion/render/images';
async function strictPrepare(project){
 await window.golden.ready;
 const pending=[];
 const decode=(image,id)=>{image.decoding='sync';pending.push(image.decode().catch(()=>{throw new Error('TYPE_INVALID: ASSET_DECODE '+id);}));};
 for(const a of Object.values(project.assets))decode(getOrCreateImageElement(a.id,a.dataUrl),a.id);
 for(const d of Object.values(project.motionDocuments))for(const o of Object.values(d.objects))if(o.kind==='svg'&&o.svgData)decode(getOrCreateSvgImageElement(o.id,o.svgData),o.id);
 await Promise.all(pending);await document.fonts.ready;
}
`;
