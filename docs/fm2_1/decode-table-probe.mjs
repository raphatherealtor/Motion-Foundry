import{build}from'/root/projects/motion-suite-m2/node_modules/vite/dist/node/index.js';
import{chromium}from'/root/projects/motion-foundry/tooling/m1-browser/node_modules/playwright/index.mjs';
import{serveBundle}from'../../dist/src/adapters/motion-suite/harness.js';
import fs from'node:fs';
const pageDir='/root/projects/motion-foundry/runs/fm2-1/page',outDir='/root/projects/motion-foundry/runs/fm2-1/bundle-probe';
fs.mkdirSync(pageDir,{recursive:true});fs.writeFileSync(pageDir+'/index.html','<html><script type="module" src="./main.ts"></script></html>');
fs.writeFileSync(pageDir+'/main.ts',`
window.probe=(async()=>{
const W=256,H=256;
const glc=document.createElement('canvas');glc.width=W;glc.height=H;
const gl=glc.getContext('webgl2',{premultipliedAlpha:true,preserveDrawingBuffer:true,alpha:true});
const vs=\`#version 300 es
in vec2 pos;void main(){gl_Position=vec4(pos,0.,1.);}\`;
const fsS=\`#version 300 es
precision highp float;uniform sampler2D tex;out vec4 o;
void main(){o=texelFetch(tex,ivec2(gl_FragCoord.xy),0);}\`;
const mk=(t,s)=>{const sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);return sh;};
const pr=gl.createProgram();gl.attachShader(pr,mk(gl.VERTEX_SHADER,vs));gl.attachShader(pr,mk(gl.FRAGMENT_SHADER,fsS));gl.linkProgram(pr);gl.useProgram(pr);
const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
const data=new Uint8Array(W*H*4);
for(let a=0;a<H;a++)for(let p=0;p<W;p++){const i=4*(a*W+p);data[i]=p;data[i+1]=p;data[i+2]=p;data[i+3]=a;}
gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,W,H,0,gl.RGBA,gl.UNSIGNED_BYTE,data);
const vao=gl.createVertexArray();gl.bindVertexArray(vao);
const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
const loc=gl.getAttribLocation(pr,'pos');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
gl.viewport(0,0,W,H);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
const glread=new Uint8Array(W*H*4);gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,glread);
const cv=document.createElement('canvas');cv.width=W;cv.height=H;
const ctx=cv.getContext('2d',{willReadFrequently:true});
ctx.drawImage(glc,0,0);
const out=Array.from(ctx.getImageData(0,0,W,H).data);
return {decoded:out,gl:Array.from(glread)};
})();
`);
await build({root:pageDir,configFile:false,logLevel:'warn',base:'./',build:{outDir,emptyOutDir:true,minify:false,target:'es2022',assetsInlineLimit:0}});
const server=await serveBundle(outDir);
const browser=await chromium.launch({executablePath:'/root/projects/motion-foundry/tooling/m1-browser/browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
const page=await (await browser.newContext()).newPage();
page.on('pageerror',e=>console.log('PAGEERROR',String(e)));
await page.goto(server.url);
const probe=await page.evaluate(()=>window.probe);
fs.writeFileSync('/root/projects/motion-foundry/runs/fm2-1/decode-table.json',JSON.stringify(probe));
console.log('bytes',probe.decoded.length);
await browser.close();await server.close();
