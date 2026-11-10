import{createServer}from'/root/projects/motion-suite-m2/node_modules/vite/dist/node/index.js';
import{chromium}from'../../tooling/m1-browser/node_modules/playwright/index.mjs';import fs from'node:fs';import{shell,legacy}from'../m2_step0/probe-config.mjs';
const root='/root/projects/motion-suite-m2';const server=await createServer({root,configFile:false,resolve:{alias:{'@':root+'/src'}},css:{postcss:{plugins:[]}},server:{host:'127.0.0.1',port:0}});await server.listen();const url=`http://127.0.0.1:${server.httpServer.address().port}`;const runs=[];
try{for(let repeat=0;repeat<5;repeat++){
 const browser=await chromium.launch({executablePath:shell,args:['--no-sandbox',...legacy]});
 try{const context=await browser.newContext({serviceWorkers:'block'});await context.route('**/*',r=>new URL(r.request().url()).origin===url?r.continue():r.abort());const page=await context.newPage();await page.goto(url+'/tests/golden/assets/checker.png');
 const cases=await page.evaluate(async()=>{
 const{createMotionDocument}=await import('/src/motion/engine/motion-document.ts');const{createObject}=await import('/src/motion/host/operations.ts');const{drawPlanes}=await import('/src/motion/render/drawDocument.ts');const{buildSpatialFrame}=await import('/src/motion/render/spatialProjection.ts');
 const rows=[];for(const[opacity,stroke]of [[1,16],[.5,0],[.5,16],[.25,16]]){
 const doc=createMotionDocument('opacity-probe',{value:30,timescale:30},30,128,128);doc.id='probe';doc.backgroundColor='#000000';
 const obj=createObject('shape','probe');obj.id='shape';obj.shapeFillColor='#ff0000';obj.shapeStrokeColor=stroke?'#0000ff':'transparent';obj.shapeStrokeWidth=stroke;obj.transform.opacity=opacity;obj.transform.scaleX=obj.transform.scaleY=1;doc.objects={shape:obj};doc.rootObjectIds=['shape'];
 const project={activeDocumentId:doc.id,motionDocuments:{[doc.id]:doc},assets:{}};
 const canvas=()=>{const c=document.createElement('canvas');c.width=c.height=128;return c;};
 const direct=canvas(),layer=canvas(),isolated=canvas();const d=direct.getContext('2d'),l=layer.getContext('2d'),i=isolated.getContext('2d');
 let frame=buildSpatialFrame(doc,0);drawPlanes(d,doc,project,frame,frame.planes,true);
 obj.transform.opacity=1;frame=buildSpatialFrame(doc,0);drawPlanes(l,doc,project,frame,frame.planes,false);
 i.fillStyle='#000';i.fillRect(0,0,128,128);i.globalAlpha=opacity;i.drawImage(layer,0,0);
 const a=d.getImageData(0,0,128,128).data,b=i.getImageData(0,0,128,128).data;
 let changed=0,maxDelta=0,squared=0;for(let p=0;p<a.length;p+=4){let different=false;for(let c=0;c<4;c++){const delta=Math.abs(a[p+c]-b[p+c]);different||=delta!==0;maxDelta=Math.max(maxDelta,delta);squared+=delta*delta;}if(different)changed++;}
 const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');
 const sample=4*(64*128+18);rows.push({opacity,stroke,changedPixels:changed,totalPixels:128*128,maxDelta,psnr:squared?10*Math.log10(255**2/(squared/a.length)):null,sample:{x:18,y:64,direct:Array.from(a.slice(sample,sample+4)),isolated:Array.from(b.slice(sample,sample+4))},directHash:await hash(a),isolatedHash:await hash(b),directPng:direct.toDataURL(),isolatedPng:isolated.toDataURL()});
 }return rows;
 });for(const c of cases){if(repeat===0&&c.opacity===.5&&c.stroke===16){for(const key of ['direct','isolated'])fs.writeFileSync(`docs/m2_1/opacity-${key}.png`,Buffer.from(c[key+'Png'].split(',')[1],'base64'));}delete c.directPng;delete c.isolatedPng;}
 runs.push({repeat,browser:browser.version(),cases});
 }finally{await browser.close();}
}}finally{await server.close();}
fs.writeFileSync('docs/m2_1/opacity-semantics.json',JSON.stringify({productSha:'db36db39821f46ec4b7057bb431ffb9e82473c33',kind:'source-path discriminator; not a GPU parity test',runs},null,2));console.log(JSON.stringify(runs[0]));
