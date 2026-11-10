import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import type {RendererAdapter} from '../../adapters.js';
import type {Range} from '../../contracts.js';
import {sha256,canonical} from '../../hash.js';
import {buildHarness} from './harness.js';
import {revisionId,renderId} from './identity.js';
import {foundryArgs,goldenArgs,browserContext} from './environment.js';
import type {HarnessOptions} from './environment.js';
import {RenderSession} from './session.js';
import {measureParity,sampledFrames} from './parity.js';
export class MotionSuiteRenderer implements RendererAdapter {
 // Frozen M0 interface uses this literal; actual verification lives in parity artifacts.
 readonly status='UNVERIFIED' as const;
 constructor(readonly options:HarnessOptions){}
 private bundle?:Awaited<ReturnType<typeof buildHarness>>;
 async prepare(){return this.bundle??=await buildHarness(this.options.checkout,this.options.workDir);}
 async synthetic(){
  const bundle=await this.prepare(),s=await new RenderSession().open(this.options,bundle.outDir,foundryArgs);
  try{return await s.page.evaluate(()=>(window as any).foundryMS.synthetic());}finally{await s.close();}
 }
 async render(snapshot:unknown,range:Range){
  if(!Number.isSafeInteger(range.start)||!Number.isSafeInteger(range.end)||range.start<0||range.end<=range.start)throw new Error('TYPE_INVALID: NON_INTEGER_FRAME range');
  const bundle=await this.prepare(),s=await new RenderSession().open(this.options,bundle.outDir,foundryArgs);
  let g:RenderSession|undefined;
  try{
   const project=await s.page.evaluate(p=>(window as any).foundryMS.parse(p),snapshot);
   const doc=project.motionDocuments[project.activeDocumentId];
   if(doc.fps!==30)throw new Error('TYPE_INVALID: fps must be 30/1');
   if(range.end>doc.duration.value*30/doc.duration.timescale)throw new Error('OUT_OF_BOUNDS: frame range');
   const revision_id=revisionId(null,project),config={ms_sha:bundle.sha,harness_hash:bundle.bundle_hash,mode:'preview',browser:s.version(),browser_binary_sha256:sha256(readFileSync(this.options.browserPath)),flags:foundryArgs,golden_flags:goldenArgs,context:browserContext};
   const render_id=renderId(revision_id,config,range),dir=resolve(this.options.workDir,'renders',render_id,randomUUID());mkdirSync(resolve(dir,'frames'),{recursive:true});
   const {PNG}=createRequire(resolve(this.options.checkout,'package.json'))('pngjs');
   const frames=[];
   for(let i=range.start;i<range.end;i++){
    const rendered=await s.render(project,i,'preview'),rgba=Buffer.from(rendered.base64,'base64');
    const path='frames/f'+String(i).padStart(4,'0')+'.png';
    const png=new PNG({width:rendered.width,height:rendered.height});png.data=rgba;const encoded=PNG.sync.write(png,{deflateLevel:9,filterType:4});writeFileSync(resolve(dir,path),encoded);
    frames.push({i,width:rendered.width,height:rendered.height,path,sha256:sha256(encoded),rgba_sha256:sha256(rgba)});
   }
   for(const i of [range.end-1,range.start,range.end-1,range.start+Math.floor((range.end-range.start)/2)]){
    if(sha256(Buffer.from((await s.render(project,i,'preview')).base64,'base64'))!==frames[i-range.start].rgba_sha256)throw new Error('NONDETERMINISTIC: out-of-order seek');
   }
   g=await new RenderSession().open(this.options,bundle.outDir,goldenArgs);
   const samples=sampledFrames(range.start,range.end),pairs=await measureParity(project,samples,s,g);
   const parity={schema:'foundry.render_parity/0.1',render_id,ms_sha:bundle.sha,frames:samples,pairs,status:pairs.some(p=>p.status==='BLOCKED')?'BLOCKED':pairs.some(p=>p.status==='FAIL')?'FAIL':'PASS',flag_diff:{foundry_only:foundryArgs.filter(a=>!goldenArgs.includes(a))}};
   for(const [name,value] of Object.entries({'project.json':project,'renderer-config.json':config,'frames.json':frames,'parity.json':parity}))writeFileSync(resolve(dir,name),canonical(value)+'\n');
   return {dir,render_id,revision_id,frames,parity};
  }finally{await g?.close();await s.close();}
 }
}
