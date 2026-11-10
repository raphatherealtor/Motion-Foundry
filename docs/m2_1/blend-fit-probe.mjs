import{build}from'/root/projects/motion-suite-m2/node_modules/vite/dist/node/index.js';
import{chromium}from'../../tooling/m1-browser/node_modules/playwright/index.mjs';
import{serveBundle}from'../../dist/src/adapters/motion-suite/harness.js';
import fs from'node:fs';
const root='/root/projects/motion-suite-m2',pageDir='/root/projects/motion-foundry/runs/m2-1/page',outDir='/root/projects/motion-foundry/runs/m2-1/bundle-probe';
fs.mkdirSync(pageDir,{recursive:true});fs.writeFileSync(pageDir+'/index.html','<html><script type="module" src="./main.ts"></script></html>');
fs.writeFileSync(pageDir+'/main.ts',`
window.probe=(async()=>{
const W=256,H=256;
const mk=()=>{const c=document.createElement('canvas');c.width=W;c.height=H;return c;};
const grab=cv=>Array.from(cv.getContext('2d',{willReadFrequently:true}).getImageData(0,0,W,H).data);
const out={};
// S1: transparent dst, gray src grid: pixel (x=c, y=a)
{const cv=mk(),ctx=cv.getContext('2d',{willReadFrequently:true});
 for(let a=0;a<256;a++)for(let c=0;c<256;c++){ctx.fillStyle='rgba('+c+','+c+','+c+','+(a/255)+')';ctx.fillRect(c,a,1,1);}
 out.S1=grab(cv);}
// S2: opaque gray dst grid (x=D), fixed gray src per canvas, alpha rows
out.S2={};
for(const cF of [0,1,7,16,32,64,128,192,200,255]){
 const cv=mk(),ctx=cv.getContext('2d',{willReadFrequently:true});
 for(let D=0;D<256;D++){ctx.fillStyle='rgb('+D+','+D+','+D+')';ctx.fillRect(D,0,1,H);}
 for(let a=0;a<256;a++){ctx.fillStyle='rgba('+cF+','+cF+','+cF+','+(a/255)+')';ctx.fillRect(0,a,W,1);}
 out.S2[cF]=grab(cv);}
// colored src over gray dst
{const cv=mk(),ctx=cv.getContext('2d',{willReadFrequently:true});
 for(let D=0;D<256;D++){ctx.fillStyle='rgb('+D+','+D+','+D+')';ctx.fillRect(D,0,1,H);}
 for(let a=0;a<256;a++){ctx.fillStyle='rgba(255,0,128,'+(a/255)+')';ctx.fillRect(0,a,W,1);}
 out.S2col=grab(cv);}
// S3: semi-transparent dst: x=D, y=dstAlpha d, one canvas per src alpha a
out.S3={};
for(const cF of [64,200])for(const a of [1,7,64,128,200,255]){
 const cv=mk(),ctx=cv.getContext('2d',{willReadFrequently:true});
 for(let d=0;d<256;d++)for(let D=0;D<256;D++){ctx.fillStyle='rgba('+D+','+D+','+D+','+(d/255)+')';ctx.fillRect(D,d,1,1);}
 for(let d=0;d<256;d++){ctx.fillStyle='rgba('+cF+','+cF+','+cF+','+(a/255)+')';ctx.fillRect(0,d,W,1);}
 out.S3[cF+'_'+a]=grab(cv);}
// Part D: premul byte access via createImageBitmap(premultiply) -> texImage2D -> readPixels
const gl=document.createElement('canvas').getContext('webgl2',{premultipliedAlpha:false});
const samples=[];
for(const c of [0,1,7,32,64,128,200,255])for(const a of [1,2,3,5,7,13,64,127,128,200,254,255]){
 const src=document.createElement('canvas');src.width=1;src.height=1;
 const sctx=src.getContext('2d');sctx.fillStyle='rgba('+c+','+(255-c)+','+c+','+(a/255)+')';sctx.fillRect(0,0,1,1);
 for(const mode of ['premultiply','none']){
  const bmp=await createImageBitmap(src,{premultiplyAlpha:mode,colorSpaceConversion:'none'});
  const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,bmp);
  const fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);
  const px=new Uint8Array(4);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);
  samples.push({c,a,mode,bytes:Array.from(px)});
  gl.deleteFramebuffer(fb);gl.deleteTexture(bmp?tex:tex);bmp.close&&bmp.close();
 }
 const straight=Array.from(sctx.getImageData(0,0,1,1).data);
 samples.push({c,a,mode:'getImageData',bytes:straight});
}
out.partD=samples;
// Exact repro of the failing draw: dst opaque (240,234,219), src rgba(32,37,44,7/255)
{const cv=document.createElement('canvas');cv.width=2;cv.height=1;const ctx=cv.getContext('2d',{willReadFrequently:true});
 ctx.fillStyle='rgb(240,234,219)';ctx.fillRect(0,0,1,1);
 ctx.fillStyle='rgba(32,37,44,'+(7/255)+')';ctx.fillRect(0,0,1,1);
 out.repro=Array.from(ctx.getImageData(0,0,2,1).data);}
return out;
})();
`);
await build({root:pageDir,configFile:false,logLevel:'warn',base:'./',build:{outDir,emptyOutDir:true,minify:false,target:'es2022',assetsInlineLimit:0}});
const server=await serveBundle(outDir);
const browser=await chromium.launch({executablePath:'../../tooling/m1-browser/browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
const page=await (await browser.newContext()).newPage();
page.on('pageerror',e=>console.log('PAGEERROR',String(e)));
await page.goto(server.url);
const probe=await page.evaluate(()=>window.probe);
fs.mkdirSync('/root/projects/motion-foundry/runs/m2-1',{recursive:true});
fs.writeFileSync('/root/projects/motion-foundry/runs/m2-1/blend-fit-raw.json',JSON.stringify(probe));
console.log('repro',JSON.stringify(probe.repro));
console.log('partD sample',JSON.stringify(probe.partD.slice(0,6)));
console.log('bytes',fs.statSync('/root/projects/motion-foundry/runs/m2-1/blend-fit-raw.json').size);
await browser.close();await server.close();
