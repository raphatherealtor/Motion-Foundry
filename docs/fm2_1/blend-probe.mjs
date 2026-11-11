import{build}from'/root/projects/motion-suite-m2/node_modules/vite/dist/node/index.js';
import{chromium}from'../../tooling/m1-browser/node_modules/playwright/index.mjs';
import{serveBundle}from'../../dist/src/adapters/motion-suite/harness.js';
import fs from'node:fs';
const root='/root/projects/motion-suite-m2',pageDir='/root/projects/motion-foundry/runs/fm2-1/page',outDir='/root/projects/motion-foundry/runs/fm2-1/bundle-probe';
fs.mkdirSync(pageDir,{recursive:true});fs.writeFileSync(pageDir+'/index.html','<html><script type="module" src="./main.ts"></script></html>');
fs.writeFileSync(pageDir+'/main.ts',`
const out={};
const cv=document.createElement('canvas');cv.width=4;cv.height=4;const ctx=cv.getContext('2d',{willReadFrequently:true});
const A=7/255;const src='rgba(32,37,44,'+A+')';
// A: one 8-bit paint on transparent dst
ctx.clearRect(0,0,4,4);ctx.fillStyle=src;ctx.fillRect(0,0,1,1);out.A=Array.from(ctx.getImageData(0,0,1,1).data);
// B: same paint twice in a row (two separate draws)
ctx.clearRect(0,0,4,4);ctx.fillStyle=src;ctx.fillRect(0,0,1,1);ctx.fillRect(0,0,1,1);out.B=Array.from(ctx.getImageData(0,0,1,1).data);
// C: dst alpha 128, src alpha 128, red over blue
ctx.clearRect(0,0,4,4);ctx.fillStyle='rgba(0,0,255,0.5019607843137255)';ctx.fillRect(0,0,1,1);ctx.fillStyle='rgba(255,0,0,0.5019607843137255)';ctx.fillRect(0,0,1,1);out.C=Array.from(ctx.getImageData(0,0,1,1).data);
// C2: src alpha 129
ctx.clearRect(0,0,4,4);ctx.fillStyle='rgba(0,0,255,0.50588)';ctx.fillRect(0,0,1,1);ctx.fillStyle='rgba(255,0,0,0.50588)';ctx.fillRect(0,0,1,1);out.C2=Array.from(ctx.getImageData(0,0,1,1).data);
// D: premultiplied upload round-trip
const gl=document.createElement('canvas').getContext('webgl2',{premultipliedAlpha:false});
const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([32,37,44,7]));
const fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);
const px=new Uint8Array(4);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);out.D=Array.from(px);
// E: float16 canvas getImageData of same paint
try{
const cv2=document.createElement('canvas');cv2.width=1;cv2.height=1;
const ctx2=cv2.getContext('2d',{willReadFrequently:true,colorType:'float16'});
ctx2.fillStyle=src;ctx2.fillRect(0,0,1,1);
const id=ctx2.getImageData(0,0,1,1,{pixelFormat:'rgba-float16'});out.E=Array.from(id.data.slice(0,4));
}catch(e){out.E_error=String(e);}
window.probe=out;
`);
await build({root:pageDir,configFile:false,logLevel:'warn',base:'./',build:{outDir,emptyOutDir:true,minify:false,target:'es2022',assetsInlineLimit:0}});
const server=await serveBundle(outDir);
const browser=await chromium.launch({executablePath:'../../tooling/m1-browser/browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
const page=await (await browser.newContext()).newPage();
page.on('pageerror',e=>console.log('PAGEERROR',String(e)));
await page.goto(server.url);
const probe=await page.evaluate(()=>window.probe);
console.log(JSON.stringify(probe,null,1));
await browser.close();await server.close();
