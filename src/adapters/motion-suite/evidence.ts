import {readFileSync,writeFileSync,realpathSync,cpSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import AjvImport from 'ajv';
import {schemas} from '../../schemas.js';
import {hash,sha256,canonical} from '../../hash.js';
import type {EvidenceManifest,Range} from '../../contracts.js';
import type {MotionSuiteBoxes} from './boxes-types.js';
import {revisionId,renderId,bundleHash} from './identity.js';
const Ajv=AjvImport as unknown as typeof AjvImport.default;
const validateManifest=new Ajv({strict:true}).compile(schemas.EvidenceManifest);
const fileHash=(path:string)=>sha256(readFileSync(path));
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const mismatch=(detail:string):never=>{throw new Error('EVIDENCE_HASH_MISMATCH: '+detail);};
export function assertManifest(manifest:unknown):asserts manifest is EvidenceManifest {
 if(!validateManifest(manifest))throw new Error('TYPE_INVALID: EvidenceManifest '+JSON.stringify(validateManifest.errors));
}
interface EvidenceInput {
 project:any;config:any;render_id:string;revision_id:string;attempt_id:string;range:Range;
 frames:{i:number;path:string;sha256:string}[];rows:MotionSuiteBoxes[];
 sheet:EvidenceManifest['contact_sheet'];harnessDir:string;
}
export function emitEvidence(dir:string,data:EvidenceInput):EvidenceManifest {
 const {project,config}=data,doc=project.motionDocuments[project.activeDocumentId];
 writeFileSync(resolve(dir,'boxes.jsonl'),data.rows.map(canonical).join('\n')+'\n');
 writeFileSync(resolve(dir,'intent.json'),'null\n');
 cpSync(data.harnessDir,resolve(dir,'harness'),{recursive:true,errorOnExist:true});
 const manifest:EvidenceManifest={schema:'foundry.evidence/0.1',render_id:data.render_id,attempt_id:data.attempt_id,revision_id:data.revision_id,candidate_id:null,hashes:{schema:hash(schemas),source:data.revision_id,assets:hash(project.assets),renderer_config:hash(config)},logical:{w:doc.width,h:doc.height},output:{w:doc.width,h:doc.height},transform:{scale_x:1,scale_y:1,offset_x:0,offset_y:0},fps:{num:30,den:1},range:data.range,timebase:'frame',frames:data.frames.map(f=>({i:f.i,label:'f'+String(f.i).padStart(4,'0'),path:f.path,sha256:f.sha256})),contact_sheet:data.sheet,object_boxes:{path:'boxes.jsonl',sha256:fileHash(resolve(dir,'boxes.jsonl'))},audio:null,created_at:new Date().toISOString()};
 assertManifest(manifest);writeFileSync(resolve(dir,'manifest.json'),canonical(manifest)+'\n');return manifest;
}
function checkedPath(dir:string,path:string){
 const base=realpathSync(dir),file=realpathSync(resolve(dir,path));
 if(!file.startsWith(base+sep))mismatch('Artifact path escapes render directory');return file;
}
export function verifyEvidence(dir:string):EvidenceManifest {
 const manifest=read(resolve(dir,'manifest.json'));assertManifest(manifest);
 const project=read(resolve(dir,'project.json')),config=read(resolve(dir,'renderer-config.json')),intent=read(resolve(dir,'intent.json'));
 for(const f of [...manifest.frames,manifest.contact_sheet,manifest.object_boxes])if(fileHash(checkedPath(dir,f.path))!==f.sha256)mismatch(f.path);
 const revision=revisionId(intent,project);
 if(revision!==manifest.revision_id||manifest.hashes.source!==revision)mismatch('project revision');
 if(manifest.hashes.assets!==hash(project.assets))mismatch('assets');
 if(manifest.hashes.schema!==hash(schemas))mismatch('schemas');
 if(manifest.hashes.renderer_config!==hash(config))mismatch('renderer configuration');
 if(config.harness_hash!==bundleHash(resolve(dir,'harness')))mismatch('harness bundle');
 if(renderId(revision,config,manifest.range)!==manifest.render_id)mismatch('render identity');
 if(manifest.range.end<=manifest.range.start||manifest.frames.length!==manifest.range.end-manifest.range.start)mismatch('frame coverage');
 for(const [i,f] of manifest.frames.entries())if(f.i!==manifest.range.start+i)mismatch('frame order');
 const cells=manifest.frames.filter((_,i)=>i%manifest.contact_sheet.stride===0).map((f,cell)=>({cell,frame:f.i}));
 if(canonical(cells)!==canonical(manifest.contact_sheet.cells)||manifest.contact_sheet.stride!==config.evidence.stride)mismatch('contact-sheet mapping');
 const rows=readFileSync(checkedPath(dir,manifest.object_boxes.path),'utf8').trim().split('\n').map(line=>JSON.parse(line)) as MotionSuiteBoxes[];
 if(canonical(rows.map(r=>r.frame))!==canonical(manifest.frames.map(f=>f.i)))mismatch('box coverage');
 const doc=project.motionDocuments[project.activeDocumentId];
 if(manifest.fps.num!==30||manifest.fps.den!==1||canonical(manifest.logical)!==canonical({w:doc.width,h:doc.height})||canonical(manifest.output)!==canonical(manifest.logical)||canonical(manifest.transform)!==canonical({scale_x:1,scale_y:1,offset_x:0,offset_y:0}))mismatch('coordinate system');
 return manifest;
}
