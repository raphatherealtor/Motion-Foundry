import {chromium,Page} from 'playwright';
import {mkdirSync,readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {Scene,html,assets,root} from './scene.js';
import {hash,sha256,canonical} from './hash.js';
import {read,write,fileHash,fail} from './io.js';
import {schemas} from './schemas.js';
import {EvidenceManifest} from './contracts.js';
const knobs=read(resolve(root,'config/foundry.config.json'));
export const config={viewport:{width:1080,height:1920},deviceScaleFactor:knobs.review_scale,args:['--no-sandbox','--disable-gpu','--font-render-hinting=none'],stride:knobs.contact_sheet_stride,render_timeout_s:knobs.render_timeout_s,asset_ready_timeout_s:knobs.asset_ready_timeout_s,max_output_mb:knobs.max_output_mb,visibility_opacity_threshold:knobs.visibility_opacity_threshold};
export interface Word {object:string;word:string;text:string;bbox:number[];opacity:number;displayed:boolean;visible:boolean;fontSize:number}
export interface Boxes {frame:number;words:Word[];objects:Word[]}
export async function boxes(page:Page,frame:number):Promise<Boxes>{return page.evaluate(({frame,threshold})=>{
 const extract=(el:Element)=>{const r=el.getBoundingClientRect();let opacity=1,displayed=true;for(let p:Element|null=el;p;p=p.parentElement){const s=getComputedStyle(p);opacity*=Number(s.opacity);displayed&&=s.display!=='none'&&s.visibility!=='hidden'}const d=(el as HTMLElement).dataset;return {object:d.object||el.id,word:d.word||el.id,text:el.textContent||'',bbox:[r.left,r.top,r.right,r.bottom],opacity,displayed,visible:displayed&&opacity>threshold&&r.right>0&&r.bottom>0&&r.left<1080&&r.top<1920,fontSize:parseFloat(getComputedStyle(el).fontSize)}};
 return {frame,words:[...document.querySelectorAll('.word')].map(extract),objects:[...document.querySelectorAll('body>div')].map(extract)};
 },{frame,threshold:config.visibility_opacity_threshold})}
export function verifyHashes(dir:string){const m=read<EvidenceManifest>(resolve(dir,'manifest.json'));for(const f of [...m.frames,m.contact_sheet,m.object_boxes])if(fileHash(resolve(dir,f.path))!==f.sha256)fail('EVIDENCE_HASH_MISMATCH');if(m.hashes.assets!==hash(assets())||m.hashes.source!==hash(read(resolve(dir,'scene.json')))||m.hashes.renderer_config!==hash(read(resolve(dir,'renderer-config.json')))||m.hashes.schema!==hash(schemas))fail('EVIDENCE_HASH_MISMATCH');return m}
export const renderIdentity=(scene:Scene,renderer_config:unknown)=>hash({schema:hash(schemas),source:hash(scene),assets:hash(assets()),renderer_config,range:{start:0,end:scene.frames},output:{w:1080*config.deviceScaleFactor,h:1920*config.deviceScaleFactor}});
export async function render(scene:Scene,out:string,noCache=false,candidate_id:string|null=null){
 const revision_id=hash(scene),browser=await chromium.launch({executablePath:'/usr/local/bin/chromium',args:config.args});
 try{
 const renderer_config={...config,browser:browser.version(),node:process.version,adapter_hash:hash({render:fileHash(resolve(root,'dist/src/render.js')),scene:fileHash(resolve(root,'dist/src/scene.js'))}),ffmpeg:spawnSync('ffmpeg',['-version'],{encoding:'utf8'}).stdout?.split('\n')[0]||'NOT_INSTALLED',audio:'NOT_RUN'};
 const render_id=renderIdentity(scene,renderer_config);
 const parent=resolve(out,'renders',render_id),attempt_id=randomUUID(),dir=resolve(parent,attempt_id);
 let cached:string|undefined;
 if(!noCache&&existsSync(parent))for(const name of readdirSync(parent)){try{verifyHashes(resolve(parent,name));cached=resolve(parent,name);break}catch{}}
 mkdirSync(resolve(dir,'frames'),{recursive:true});
 if(cached){const {copyFileSync}=await import('node:fs');const m=verifyHashes(cached);for(const f of [...m.frames,m.contact_sheet,m.object_boxes])copyFileSync(resolve(cached,f.path),resolve(dir,f.path));write(resolve(dir,'scene.json'),scene);write(resolve(dir,'renderer-config.json'),renderer_config);write(resolve(dir,'manifest.json'),{...m,attempt_id,candidate_id,created_at:new Date().toISOString()});return dir}
 const page=await browser.newPage({viewport:config.viewport,deviceScaleFactor:config.deviceScaleFactor});
 let network=false;const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{network=true;return r.abort()});
 await page.setContent(html(scene),{waitUntil:'load',timeout:config.asset_ready_timeout_s*1000});
 await page.waitForFunction('window.__foundryReady === true && document.fonts.status === "loaded" && [...document.images].every(i=>i.complete && i.naturalWidth>0)',{},{timeout:config.asset_ready_timeout_s*1000});
 const frames:EvidenceManifest['frames']=[],rows:Boxes[]=[];let size=0;const start=Date.now();
 for(let i=0;i<scene.frames;i++){
 if(Date.now()-start>config.render_timeout_s*1000)fail('BUDGET_EXHAUSTED');
 await page.evaluate(i=>(window as any).seekFrame(i),i);
 const label='f'+String(i).padStart(4,'0'),path=`frames/${label}.png`;
 const png=await page.screenshot({path:resolve(dir,path),type:'png'});size+=png.length;
 if(size>config.max_output_mb*1024*1024)fail('BUDGET_EXHAUSTED');
 frames.push({i,label,path,sha256:sha256(png)});rows.push(await boxes(page,i));
 }
 // Repeated, out-of-order seeks must match both pixels and transformed bounds.
 for(const i of [200,10,200,135]){
 await page.evaluate(i=>(window as any).seekFrame(i),i);
 if(sha256(await page.screenshot())!==frames[i].sha256||canonical(await boxes(page,i))!==canonical(rows[i]))fail('NONDETERMINISTIC');
 }
 if(network||errors.length)fail('FORBIDDEN_OP: '+errors.join(';'));
 writeFileSync(resolve(dir,'boxes.jsonl'),rows.map(canonical).join('\n')+'\n',{flag:'wx'});
 const cells=frames.filter(f=>f.i%config.stride===0).map((f,cell)=>({cell,frame:f.i}));
 const sheet=await browser.newPage({viewport:{width:600,height:Math.ceil(cells.length/6)*200},deviceScaleFactor:1});
 await sheet.route('**/*',r=>r.abort());
 await sheet.setContent('<style>*{box-sizing:border-box}body{margin:0;display:grid;grid-template-columns:repeat(6,100px);background:#fff}div{height:200px;font:12px monospace}img{width:100px;height:178px}</style>'+cells.map(c=>`<div>cell ${c.cell}: f${c.frame}<img src="data:image/png;base64,${readFileSync(resolve(dir,frames[c.frame].path)).toString('base64')}"></div>`).join(''));
 await sheet.waitForFunction('[...document.images].every(i=>i.complete)');
 await sheet.screenshot({path:resolve(dir,'contact_sheet.png')});
 const manifest:EvidenceManifest={schema:'foundry.evidence/0.1',render_id,attempt_id,revision_id,candidate_id,hashes:{schema:hash(schemas),source:revision_id,assets:hash(assets()),renderer_config:hash(renderer_config)},logical:{w:1080,h:1920},output:{w:1080*config.deviceScaleFactor,h:1920*config.deviceScaleFactor},transform:{scale_x:config.deviceScaleFactor,scale_y:config.deviceScaleFactor,offset_x:0,offset_y:0},fps:scene.fps,range:{start:0,end:270},timebase:'frame',frames,contact_sheet:{path:'contact_sheet.png',sha256:fileHash(resolve(dir,'contact_sheet.png')),cells,stride:config.stride},object_boxes:{path:'boxes.jsonl',sha256:fileHash(resolve(dir,'boxes.jsonl'))},audio:null,created_at:new Date().toISOString()};
 write(resolve(dir,'scene.json'),scene);write(resolve(dir,'renderer-config.json'),renderer_config);write(resolve(dir,'manifest.json'),manifest);return dir;
 }finally{await browser.close()}
}
