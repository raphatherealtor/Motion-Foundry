import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {sha256} from '../../hash.js';
import type {Page} from 'playwright';
export async function contactSheet(page:Page,dir:string,frames:{i:number;path:string}[],size:{width:number;height:number},PNG:any,stride=15){
 const selected=frames.filter((_,i)=>i%stride===0),cells=selected.map((f,cell)=>({cell,frame:f.i}));
 const images=selected.map(f=>readFileSync(resolve(dir,f.path)).toString('base64'));
 const packed=await page.evaluate(async({images,cells,size})=>{
  await document.fonts.ready;
  const w=100,imageH=Math.ceil(w*size.height/size.width),cellH=imageH+22;
  const canvas=document.createElement('canvas');canvas.width=600;canvas.height=Math.ceil(cells.length/6)*cellH;
  const ctx=canvas.getContext('2d')!;ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#111';ctx.font='400 12px "IBM Plex Sans"';
  for(let i=0;i<images.length;i++){
   const x=i%6*w,y=Math.floor(i/6)*cellH,img=new Image();img.decoding='sync';img.src='data:image/png;base64,'+images[i];await img.decode();
   ctx.fillText('c'+cells[i].cell+' f'+cells[i].frame,x+2,y+15);ctx.drawImage(img,x,y+22,w,imageH);
  }
  const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;let binary='';for(let i=0;i<data.length;i+=0x8000)binary+=String.fromCharCode(...data.subarray(i,i+0x8000));
  return {width:canvas.width,height:canvas.height,base64:btoa(binary)};
 },{images,cells,size});
 const png=new PNG({width:packed.width,height:packed.height});png.data=Buffer.from(packed.base64,'base64');const bytes=PNG.sync.write(png,{deflateLevel:9,filterType:4});
 writeFileSync(resolve(dir,'contact_sheet.png'),bytes);return {path:'contact_sheet.png',sha256:sha256(bytes),cells,stride};
}
