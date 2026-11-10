import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import AjvImport from 'ajv';
import {root} from '../../scene.js';
const Ajv=AjvImport as unknown as typeof AjvImport.default;
const load=(name:string)=>JSON.parse(readFileSync(resolve(root,'src/adapters/motion-suite/schemas',name),'utf8'));
export const v2={operation:load('operation-envelope.v2.json'),proposal:load('repair-proposal.v2.json'),review:load('review-request.v2.json')};
export const allowlist=load('repair-allowlist.v2.json');
const ajv=new Ajv({strict:true});ajv.addSchema(v2.operation);
if(!ajv.compile(load('allowlist.schema.v2.json'))(allowlist))throw new Error('TYPE_INVALID: M1 allowlist schema');
const proposalCheck=ajv.compile(v2.proposal),reviewCheck=ajv.compile(v2.review);
export interface OperationV2 {op:'set'|'shift_keyframes'|'set_stagger'|'set_easing'|'apply_recipe';target:string;value:any}
export interface ProposalV2 {schema:'foundry.repair_proposal/0.2';base_revision_id:string;base_render_id:string;rationale:string;ops:OperationV2[]}
export function checkProposal(value:unknown):asserts value is ProposalV2{
 const p=value as any;
 if(Array.isArray(p?.ops)&&p.ops.some((o:any)=>!['set','shift_keyframes','set_stagger','set_easing','apply_recipe'].includes(o?.op)))throw new Error('FORBIDDEN_OP: raw or unknown operation');
 if(!proposalCheck(p))throw new Error('TYPE_INVALID: v2 proposal '+JSON.stringify(proposalCheck.errors));
}
export function checkReview(value:unknown){if(!reviewCheck(value))throw new Error('TYPE_INVALID: v2 review '+JSON.stringify(reviewCheck.errors));}
