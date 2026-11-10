import {statuses} from './contracts.js';
const str={type:'string'}, num={type:'number'}, int={type:'integer',minimum:0};
const arr=(items:unknown)=>({type:'array',items});
const obj=(properties:Record<string,unknown>,required=Object.keys(properties))=>({type:'object',properties,required,additionalProperties:false});
const range=obj({start:int,end:int}), dims=obj({w:{type:'integer',minimum:1},h:{type:'integer',minimum:1}});
const ref=obj({path:str,sha256:{type:'string',pattern:'^[a-f0-9]{64}$'}});
const status={enum:statuses};
const document=(name:string,fields:Record<string,unknown>,optional:string[]=[])=>({$schema:'http://json-schema.org/draft-07/schema#',$id:`foundry.${name}/0.1`,...obj({schema:{const:`foundry.${name}/0.1`},...fields},['schema',...Object.keys(fields).filter(k=>!optional.includes(k))])});
export const schemas={
 ProposedOperation:obj({op:{const:'set'},target:{type:'string',pattern:'^objects\\.[A-Za-z0-9_-]+\\.(style|layout|timing)\\.[A-Za-z]+$'},value:{anyOf:[{type:'number'},{type:'string'},{type:'boolean'}]}}),
 RepairProposal:document('repair_proposal',{base_revision_id:str,base_render_id:str,rationale:str,ops:{type:'array',minItems:1,items:{$ref:'urn:foundry:operation:0.1'}}}),
 ValidationResult:document('validation',{render_id:str,validator:str,kind:{enum:['hard_geometry','hard_contract','heuristic']},status,params:{type:'object'},violations:arr({type:'object'}),reason_code:str},['reason_code']),
 PerceptualFinding:document('finding',{render_id:str,source:str,kind:{const:'ai_perceptual'},confidence:{type:'number',minimum:0,maximum:1},frames:arr(int),objects:arr(str),evidence_refs:arr(str),note:str}),
 ReviewRequest:document('review_request',{run_id:str,base_revision_id:str,base_render_id:str,attachments:arr(ref),failures:arr(str),window:range,allowed_ops:{const:'repair-allowlist.v1'},budget:obj({attempt:{type:'integer',minimum:1,maximum:3},max:{type:'integer',minimum:1,maximum:3}})}),
 EvidenceManifest:document('evidence',{render_id:str,attempt_id:str,revision_id:str,candidate_id:{type:['string','null']},hashes:obj({schema:str,source:str,assets:str,renderer_config:str}),logical:dims,output:dims,transform:obj({scale_x:num,scale_y:num,offset_x:num,offset_y:num}),fps:obj({num:{type:'integer',minimum:1},den:{type:'integer',minimum:1}}),range,timebase:{const:'frame'},frames:arr(obj({i:int,label:str,path:str,sha256:str})),contact_sheet:obj({path:str,sha256:str,cells:arr(obj({cell:int,frame:int})),stride:{type:'integer',minimum:1}}),object_boxes:ref,audio:{type:'null'},created_at:{type:'string'}}),
 RunResult:document('run_result',{run_id:str,status,closed_loop:{enum:['LIVE','MOCK','BLOCKED','UNREVIEWED']},reviewer:obj({adapter:str,vision_transport:str,mock:{type:'boolean'}}),attempts:arr({type:'object'}),last_passing:{type:['string','null']},budgets_used:obj({renders:int,wall_s:{type:'number',minimum:0}}),manifest_sha256:str,base_dir:str,final_dir:str,decision_log_sha256:str,validation_index_sha256:str,baseline_manifest_sha256:str,baseline_validation_index_sha256:str,reason_code:str},['manifest_sha256','base_dir','final_dir','decision_log_sha256','validation_index_sha256','baseline_manifest_sha256','baseline_validation_index_sha256','reason_code'])
};
