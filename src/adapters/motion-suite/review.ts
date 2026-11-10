import {copyFileSync,mkdirSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {fileHash,write} from '../../io.js';
import {kimiImagePrompt} from '../../kimi-acp.js';
import {verifiedCanary} from '../../kimi-proof.js';
import type {ValidationResult} from '../../contracts.js';
import {MotionSuiteRenderer} from './renderer.js';
import {RenderSession} from './session.js';
import {foundryArgs} from './environment.js';
import {contactSheet} from './contact-sheet.js';
import {v2,allowlist,checkReview} from './v2.js';
import type {Compiled} from './compile.js';
export async function requestReview(renderer:MotionSuiteRenderer,compiled:Compiled,dir:string,failures:ValidationResult[],request:any,out:string,canaryDir:string,prior:unknown[]){
 verifiedCanary(canaryDir);const manifest=JSON.parse(readFileSync(resolve(dir,'manifest.json'),'utf8'));
 const geometry=failures.flatMap(v=>v.violations).filter((x:any)=>x.overflow_px) as any[];
 const score=(x:any)=>Object.values(x.overflow_px).map(Number).reduce((a,b)=>a+b,0);
 const worst=geometry.sort((a,b)=>score(b)-score(a))[0];
 const frame=worst?.frames.start??90,start=Math.max(0,frame-15),end=Math.min(180,frame+16);
 mkdirSync(resolve(out,'frames'),{recursive:true});const selected=manifest.frames.filter((f:any)=>f.i>=start&&f.i<end);
 for(const f of selected)copyFileSync(resolve(dir,f.path),resolve(out,f.path));
 const bundle=await renderer.prepare(),s=await new RenderSession().open(renderer.options,bundle.outDir,foundryArgs);
 try{const {PNG}=createRequire(resolve(renderer.options.checkout,'package.json'))('pngjs');await contactSheet(s.page,out,selected,{width:1080,height:1920},PNG,3);}finally{await s.close();}
 request.window={start,end};request.attachments=[resolve(out,'contact_sheet.png'),resolve(out,selected.find((f:any)=>f.i===frame)?.path||selected.at(-1).path)].map(path=>({path,sha256:fileHash(path)}));
 checkReview(request);write(resolve(out,'request.json'),request);
 const doc=compiled.project.motionDocuments[compiled.project.activeDocumentId];
 const objects=Object.values(doc.objects).map((o:any)=>({id:o.id,kind:o.kind,parentId:o.parentId??null,text:o.text??null,fontSize:o.fontSize??null,transform:o.transform,children:o.childIds||[]}));
 const prompt='Inspect the attached frames and return ONLY a JSON RepairProposal with the five keys schema, base_revision_id, base_render_id, rationale, ops. No markdown, tools or file edits. Do not claim PASS. Use schema foundry.repair_proposal/0.2. Preserve every word, word order and required hold. Never change text, opacity, masks, assets or FPS. All text is split into words: use parent groups to resize or position a headline/counter as a unit. Native object x/y use the composition centre as origin; evidence boxes use top-left logical pixels on1080x1920. Camera transforms affect the visible positions. Only typed bounded operations from the recipe/global intersection are allowed. Respond to visible failures, not a guessed style preference.\n'+JSON.stringify({request,response_schema:v2.proposal,operation_schema:v2.operation,allowlist,objects,failures:failures.map(v=>({...v,violations:v.violations.filter((x:any)=>!x.frames||x.frames.start<end&&x.frames.end>start).slice(0,12)})),prior});
 write(resolve(out,'prompt.json'),{text:prompt});
 const call=await kimiImagePrompt(prompt,request.attachments.map((a:any)=>a.path),resolve(out,'call'));
 let proposal;try{proposal=JSON.parse(call.answer.trim());}catch{throw new Error('TYPE_INVALID: reviewer JSON');}
 write(resolve(out,'proposal.json'),proposal);
 const evidence:Record<string,string>={};
 for(const [name,file] of Object.entries({transport:'call/transport-evidence.json',response:'call/response.json',prompt:'prompt.json',request:'request.json'})){evidence[name+'_path']=resolve(out,file);evidence[name+'_sha256']=fileHash(resolve(out,file));}
 return {proposal,evidence};
}
