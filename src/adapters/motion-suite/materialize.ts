import {hash} from '../../hash.js';
import type {MotionScene} from '../../recipes/types.js';
import {OperationV2} from './v2.js';
import {gateOperation,staggerFrames} from './gate.js';
import {compileScene,Compiled} from './compile.js';
import {lowerOperation} from './lower.js';
import {MotionSuiteRenderer} from './renderer.js';
import {RenderSession} from './session.js';
import {foundryArgs} from './environment.js';
import {durable} from './identity.js';
export interface Candidate {scene:MotionScene;ops:OperationV2[]}
export async function materialize(renderer:MotionSuiteRenderer,candidate:Candidate):Promise<Compiled>{
 const scene=structuredClone(candidate.scene);let compiled=await compileScene(renderer,scene),nativeOps:OperationV2[]=[];
 const bundle=await renderer.prepare(),session=await new RenderSession().open(renderer.options,bundle.outDir,foundryArgs);
 const apply=async(op:OperationV2)=>{
  gateOperation(scene,compiled.project,op);const ops=lowerOperation(compiled,op);
  compiled.project=await session.page.evaluate(({p,ops})=>(window as any).foundryMS.apply(p,ops),{p:compiled.project,ops});
 };
 try{
  for(const op of candidate.ops){
   gateOperation(scene,compiled.project,op);
   if(op.op==='apply_recipe'||op.op==='set_stagger'){
    const id=op.target.split('.')[1],index=scene.blocks.findIndex(b=>b.id===id);
    if(op.op==='set_stagger'){if(index<0)throw new Error('FORBIDDEN_OP: missing recipe block');scene.blocks[index].params.stagger_frames=staggerFrames(op.value);}
    else {const block={id,...op.value};if(index<0)scene.blocks.push(block);else scene.blocks[index]=block;}
    compiled=await compileScene(renderer,scene);for(const old of nativeOps)await apply(old);
   }else{nativeOps.push(op);await apply(op);}
  }
  return compiled;
 }finally{await session.close();}
}
export const projectHash=(c:Compiled)=>hash(durable(c.project));
