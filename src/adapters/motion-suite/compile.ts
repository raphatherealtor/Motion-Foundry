import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe} from '../../recipes/compiler.js';
import type {MotionScene,Descriptor} from '../../recipes/types.js';
import {sha256} from '../../hash.js';
import {root} from '../../scene.js';
import {MotionSuiteRenderer} from './renderer.js';
import {RenderSession} from './session.js';
import {foundryArgs} from './environment.js';
export interface Compiled {project:any;meta:Descriptor;ops:any[]}
export function checkTextLock(scene:MotionScene,meta:Descriptor){
 if(!scene.text_lock.path.startsWith('fixtures/m1/'))throw new Error('FORBIDDEN_OP: text lock path');
 const text=readFileSync(resolve(root,scene.text_lock.path),'utf8');
 if(sha256(text)!==scene.text_lock.sha256||text.trim().split(/\s+/).join(' ')!==meta.words.map(w=>w.text).join(' '))throw new Error('REQUIRED_CONTENT_LOST: locked script changed or reordered');
}
export async function compileScene(renderer:MotionSuiteRenderer,scene:MotionScene,checkLock=true):Promise<Compiled>{
 const desc=describe(scene),bundle=await renderer.prepare(),s=await new RenderSession().open(renderer.options,bundle.outDir,foundryArgs);
 try{const result=await s.page.evaluate(d=>(window as any).foundryMS.compile(d),desc) as Compiled;
 for(const d of Object.values(result.project.motionDocuments) as any[])for(const o of Object.values(d.objects) as any[])if(['text','text-segment'].includes(o.kind)&&(!o.sourceTokenId||!/^\S+$/.test(o.text)||o.textSegments?.length))throw new Error('FORBIDDEN_OP: recipe text must be split into words');
 if(checkLock)checkTextLock(scene,result.meta);
 return result;
 }finally{await s.close();}
}
