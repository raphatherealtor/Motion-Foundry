import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {options} from '../../../dist/src/adapters/motion-suite/defaults.js';
import {MotionSuiteRenderer} from '../../../dist/src/adapters/motion-suite/renderer.js';
import {compileScene} from '../../../dist/src/adapters/motion-suite/compile.js';
import {validateM1,passing} from '../../../dist/src/adapters/motion-suite/validate.js';
import {recipeIds} from '../../../dist/src/recipes/types.js';
const renderer=new MotionSuiteRenderer(options(resolve('runs/m1-validation'))),proof=[];
for(const recipe of recipeIds){
 const scene=JSON.parse(readFileSync('fixtures/m1/'+recipe+'/ms_scene.json','utf8'));scene.defects=[];
 const compiled=await compileScene(renderer,scene),render=await renderer.render(compiled.project,{start:0,end:180});
 const results=validateM1(scene,compiled,render.dir);
 proof.push({recipe,dir:render.dir,status:passing(results)?'PASS':'FAIL',results:results.map(r=>({id:r.validator,status:r.status,count:r.violations.length,first:r.violations[0]}))});
 writeFileSync('runs/m1-resume/validation-proof.json',JSON.stringify(proof,null,2));console.log(recipe,JSON.stringify(proof.at(-1)));
 if(!passing(results))process.exitCode=1;
}
