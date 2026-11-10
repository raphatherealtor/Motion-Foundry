import {meanLuma} from './luma.js';
import {root} from '../../scene.js';
import {manifests} from '../../recipes/registry.js';
import {v2,allowlist} from './v2.js';
import {hash} from '../../hash.js';
import {mkdirSync,writeFileSync,readFileSync,cpSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import type {RendererAdapter} from '../../adapters.js';
import type {Range} from '../../contracts.js';
import {sha256,canonical} from '../../hash.js';
import {buildHarness} from './harness.js';
import {revisionId,renderId,bundleHash} from './identity.js';
import {foundryArgs,goldenArgs,browserContext} from './environment.js';
import type {HarnessOptions} from './environment.js';
import {RenderSession} from './session.js';
import {measureParity,sampledFrames} from './parity.js';
import {emitEvidence,verifyEvidence} from './evidence.js';
import {contactSheet} from './contact-sheet.js';
import type {MotionSuiteBoxes} from './boxes-types.js';
import {normalizeProjectTiming,compositionFrames,assertFrameRange} from './timing.js';
export class MotionSuiteRenderer implements RendererAdapter {
 // Frozen M0 interface uses this literal; actual verification lives in parity artifacts.
 readonly status='UNVERIFIED' as const;
 constructor(readonly options:HarnessOptions){}
 private bundle?:Awaited<ReturnType<typeof buildHarness>>;
 async prepare(){return this.bundle??=await buildHarness(this.options.checkout,this.options.workDir);}
 async synthetic(cameraPush=false){
  const bundle=await this.prepare(),s=await new RenderSession().open(this.options,bundle.outDir,foundryArgs);
  try{return await s.page.evaluate(cameraPush=>(window as any).foundryMS.synthetic(cameraPush),cameraPush);}finally{await s.close();}
 }
 async render(snapshot:unknown,range:Range,context:{intent?:unknown;candidate_id?:string|null}={}){
  const timed=normalizeProjectTiming(snapshot);
  assertFrameRange(range,compositionFrames(timed));
  const bundle=await this.prepare(),s=await new RenderSession().open(this.options,bundle.outDir,foundryArgs);
  let g:RenderSession|undefined;
  try{
   const project=await s.page.evaluate(p=>(window as any).foundryMS.parse(p),timed);
   const doc=project.motionDocuments[project.activeDocumentId];
   const intent=context.intent??null,policy={recipes:manifests,schemas:v2,allowlist};
   const adapterDir=resolve(root,'dist/src/adapters/motion-suite');
   const revision_id=revisionId(intent,project),config={adapter_hash:bundleHash(adapterDir),policy_hash:hash(policy),ms_sha:bundle.sha,harness_hash:bundle.bundle_hash,mode:'preview',browser:s.version(),browser_binary_sha256:sha256(readFileSync(this.options.browserPath)),flags:foundryArgs,golden_flags:goldenArgs,context:browserContext,evidence:{stride:15,opacity_threshold:.02,bounds:'product-padded-projected',coordinates:'logical',luma_threshold:.35,luma_sample_stride_px:16}};
   const render_id=renderId(revision_id,config,range),attempt_id=randomUUID(),dir=resolve(this.options.workDir,'renders',render_id,attempt_id);mkdirSync(resolve(dir,'frames'),{recursive:true});
   cpSync(adapterDir,resolve(dir,'adapter'),{recursive:true});writeFileSync(resolve(dir,'policy.json'),canonical(policy)+'\n');
   const {PNG}=createRequire(resolve(this.options.checkout,'package.json'))('pngjs');
   const frames=[],rows:MotionSuiteBoxes[]=[];
   for(let i=range.start;i<range.end;i++){
    const rendered=await s.render(project,i,'preview'),rgba=Buffer.from(rendered.base64,'base64');
    const path='frames/f'+String(i).padStart(4,'0')+'.png';
    const png=new PNG({width:rendered.width,height:rendered.height});png.data=rgba;const encoded=PNG.sync.write(png,{deflateLevel:9,filterType:4});writeFileSync(resolve(dir,path),encoded);
    frames.push({i,mean_luma:meanLuma(rgba),width:rendered.width,height:rendered.height,path,sha256:sha256(encoded),rgba_sha256:sha256(rgba)});rows.push(await s.boxes(project,i));
   }
   for(const i of (range.start===0&&range.end===180?[120,10,120,75]:[range.end-1,range.start,range.end-1,range.start+Math.floor((range.end-range.start)/2)])){
    if(sha256(Buffer.from((await s.render(project,i,'preview')).base64,'base64'))!==frames[i-range.start].rgba_sha256||canonical(await s.boxes(project,i))!==canonical(rows[i-range.start]))throw new Error('NONDETERMINISTIC: out-of-order seek');
   }
   g=await new RenderSession().open(this.options,bundle.outDir,goldenArgs);
   const samples=sampledFrames(range.start,range.end),pairs=await measureParity(project,samples,s,g);
   const parity={schema:'foundry.render_parity/0.1',render_id,ms_sha:bundle.sha,frames:samples,pairs,status:pairs.some(p=>p.status==='BLOCKED')?'BLOCKED':pairs.some(p=>p.status==='FAIL')?'FAIL':'PASS',flag_diff:{foundry_only:foundryArgs.filter(a=>!goldenArgs.includes(a))}};
   for(const [name,value] of Object.entries({'project.json':project,'renderer-config.json':config,'frames.json':frames,'parity.json':parity}))writeFileSync(resolve(dir,name),canonical(value)+'\n');
   const sheet=await contactSheet(s.page,dir,frames,{width:doc.width,height:doc.height},PNG,config.evidence.stride);
   const manifest=emitEvidence(dir,{project,config,render_id,revision_id,attempt_id,range,frames,rows,sheet,intent,candidate_id:context.candidate_id,harnessDir:bundle.outDir});verifyEvidence(dir);
   return {dir,render_id,revision_id,frames,parity,manifest};
  }finally{await g?.close();await s.close();}
 }
}
