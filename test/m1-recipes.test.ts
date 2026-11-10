import test from 'node:test';
import assert from 'node:assert/strict';
import {describe} from '../src/recipes/compiler.js';
import {manifests,checkBlock} from '../src/recipes/registry.js';
import {recipeIds,MotionScene} from '../src/recipes/types.js';
import {hash} from '../src/hash.js';
const scene=(recipe:string):MotionScene=>({schema:'foundry.ms_scene/0.1',seed:7,frames:180,blocks:[{id:'fixture',recipe,params:{headline:'Every word remains',caption:'Synthetic fixture'}}],text_lock:{path:'fixtures/m1/test/script.txt',sha256:''},protected:[]});
test('all registered recipes declare whole words, hard checks and bounded repair intersection',()=>{
 for(const id of recipeIds){const m=manifests[id];assert.equal(m.text_reveal.split,'word');assert.ok(m.validators.some((v:any)=>v.id==='word_reveal.v1'));assert.ok(m.allowed_ops.length);assert.ok(m.validators.filter((v:any)=>v.id.endsWith('heuristic')).every((v:any)=>v.max_status==='WARN'));assert.doesNotThrow(()=>describe(scene(id)));}
});
test('recipe descriptions are deterministic with per-instance seeded edge geometry',()=>{
 const a=scene(recipeIds[1]),before=hash(a),one=describe(a),two=describe(a);assert.equal(hash(one),hash(two));assert.equal(hash(a),before);
 assert.equal(new Set(one.edges.map(e=>e.seed)).size,one.edges.length);assert.equal(new Set(one.edges.map(e=>e.path)).size,one.edges.length);assert.notEqual(hash(one),hash(describe({...a,seed:8})));
});
test('recipes reject arbitrary code, raw ops, wipes, masks and unregistered IDs',()=>{
 for(const key of ['preset','mask','clip','text_reveal','code','ops','asset']){const b=scene(recipeIds[0]).blocks[0];(b.params as any)[key]='typewriter';assert.throws(()=>checkBlock(b),/FORBIDDEN_OP/);}
 assert.throws(()=>checkBlock({...scene(recipeIds[0]).blocks[0],recipe:'missing'}),/TYPE_INVALID/);
 const bad=scene(recipeIds[0]);(bad.blocks[0].params as any).values=[-1,20,30];assert.throws(()=>describe(bad),/TYPE_INVALID/);
});
