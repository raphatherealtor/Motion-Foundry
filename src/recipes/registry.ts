import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import AjvImport from 'ajv';
import {root} from '../scene.js';
import {recipeIds,RecipeBlock,MotionScene} from './types.js';
const Ajv=AjvImport as unknown as typeof AjvImport.default;
const dir=resolve(root,'src/recipes');
const json=(name:string)=>JSON.parse(readFileSync(resolve(dir,name),'utf8'));
const paramsCheck=new Ajv({strict:true}).compile(json('params.schema.json'));
const recipeCheck=new Ajv({strict:true}).compile(json('recipe.schema.json'));
export const manifests=Object.fromEntries(recipeIds.map(id=>[id,json(id+'.recipe.json')]));
for(const m of Object.values(manifests))if(!recipeCheck(m))throw new Error('TYPE_INVALID: recipe manifest '+JSON.stringify(recipeCheck.errors));
export function checkBlock(b:RecipeBlock){
 if(b?.params&&Object.keys(b.params).some(k=>['preset','mask','clip','text_reveal','code','ops','asset'].includes(k)))throw new Error('FORBIDDEN_OP: unsafe recipe parameter');
 if(!b||!Object.hasOwn(manifests,b.recipe)||!/^[-a-zA-Z0-9_]+$/.test(b.id)||!paramsCheck(b.params))throw new Error('TYPE_INVALID: invalid registered recipe params');
 if(Object.keys(b).some(k=>!['id','recipe','params'].includes(k)))throw new Error('FORBIDDEN_OP: raw recipe fields');
 const m=manifests[b.recipe];
 if(m.text_reveal.mode!=='whole_word_fade_rise'||m.text_reveal.split!=='word')throw new Error('FORBIDDEN_OP: recipe must split text into whole words');
}
export function checkScene(s:MotionScene){
 if(!s||s.schema!=='foundry.ms_scene/0.1'||!Number.isSafeInteger(s.seed)||s.frames!==180||!Array.isArray(s.blocks)||!s.blocks.length||s.blocks.length>4)throw new Error('TYPE_INVALID: scene');
 if(new Set(s.blocks.map(b=>b.id)).size!==s.blocks.length)throw new Error('TYPE_INVALID: duplicate recipe block');
 s.blocks.forEach(checkBlock);
 if((s.defects||[]).some(d=>!['headline_overflow','label_clip'].includes(d)))throw new Error('TYPE_INVALID: defect');
}
