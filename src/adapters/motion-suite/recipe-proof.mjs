import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {MotionSuiteRenderer} from '../../../dist/src/adapters/motion-suite/renderer.js';
import {options} from '../../../dist/src/adapters/motion-suite/defaults.js';
import {compileScene} from '../../../dist/src/adapters/motion-suite/compile.js';
import {recipeIds} from '../../../dist/src/recipes/types.js';
import {sha256,canonical} from '../../../dist/src/hash.js';
const r=new MotionSuiteRenderer(options(resolve('runs/m1-recipes'))),results=[];
for(const recipe of recipeIds){
 const id=recipe.split('.')[0].replace('-','_'),dir=resolve('fixtures/m1',recipe);mkdirSync(dir,{recursive:true});
 const scene={schema:'foundry.ms_scene/0.1',seed:1729,frames:180,blocks:[{id,recipe,params:{headline:recipe.startsWith('vox')?'Prices shape choices':'Pieces tell stories',caption:'A synthetic visual study'}}],text_lock:{path:'fixtures/m1/'+recipe+'/script.txt',sha256:''},protected:recipe.startsWith('vox')?[]:[id+'_figure',id+'_face_cover'],timestamps:[{object:id+'_bar_0',frame:42,word_frame:45}],defects:recipe.startsWith('vox')?['headline_overflow','label_clip']:[]};
 if(!recipe.startsWith('vox'))scene.timestamps=[{object:id+'_figure',frame:45,word_frame:48}];
 const compiled=await compileScene(r,scene,false),text=compiled.meta.words.map(w=>w.text).join(' ')+'\n';
 scene.text_lock.sha256=sha256(text);writeFileSync(resolve(dir,'script.txt'),text);writeFileSync(resolve(dir,'ms_scene.json'),canonical(scene)+'\n');
 const checked=await compileScene(r,scene);writeFileSync(resolve(dir,'compile-meta.json'),canonical(checked.meta)+'\n');
 const rendered=await r.render(checked.project,{start:0,end:5});
 results.push({recipe,scene:resolve(dir,'ms_scene.json'),dir:rendered.dir,parity:rendered.parity.status,words:checked.meta.words.length});
 writeFileSync(resolve('runs/m1-resume/recipe-proof.json'),JSON.stringify(results,null,2));console.log(recipe,rendered.parity.status);
}
