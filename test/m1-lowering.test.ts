import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {root} from '../src/scene.js';
import {hash} from '../src/hash.js';
import {MotionSuiteRenderer} from '../src/adapters/motion-suite/renderer.js';
import {options} from '../src/adapters/motion-suite/defaults.js';
import {compileScene} from '../src/adapters/motion-suite/compile.js';
import {materialize,projectHash} from '../src/adapters/motion-suite/materialize.js';
test('M1 typed repairs lower through real product transactions and recipe rebuilds preserve previous ops',{timeout:180000},async()=>{
 const scene=JSON.parse(readFileSync(resolve(root,'fixtures/m1/vox-doc.chart_explainer/ms_scene.json'),'utf8')),before=hash(scene);
 const r=new MotionSuiteRenderer(options(mkdtempSync(resolve(root,'runs/m1-resume/lower-'))));
 const original=await compileScene(r,scene);
 const fixed=await materialize(r,{scene,ops:[{op:'set',target:'objects.vox_doc_headline.transform.scale',value:.6},{op:'apply_recipe',target:'blocks.vox_doc',value:{recipe:scene.blocks[0].recipe,params:{...scene.blocks[0].params,stagger_frames:5}}},{op:'set',target:'objects.vox_doc_value_2.transform.x',value:280}]});
 const doc=fixed.project.motionDocuments[fixed.project.activeDocumentId];assert.equal(doc.objects.vox_doc_headline.transform.scaleX,.6);assert.equal(doc.objects.vox_doc_headline.transform.scaleY,.6);assert.equal(doc.objects.vox_doc_value_2.transform.x,280);
 assert.equal(original.project.motionDocuments[original.project.activeDocumentId].objects.vox_doc_headline.transform.scaleX,1);assert.equal(hash(scene),before);assert.notEqual(projectHash(fixed),projectHash(original));
});
