// Read-only, in-memory execution of the pinned product's actual pure grade functions.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const checkout='/root/projects/motion-suite-m2';
function load(relative,dependencies={}){
 const source=fs.readFileSync(path.join(checkout,relative),'utf8');
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};
 vm.runInNewContext(js,{module,exports:module.exports,require:id=>{if(!Object.hasOwn(dependencies,id))throw Error('Unexpected dependency '+id);return dependencies[id];},Float32Array,Float64Array,Int32Array,Uint8Array,Uint8ClampedArray,Math});
 return module.exports;
}
const lighting=load('src/motion/render/lighting.ts');
const grade=load('src/motion/render/frameGrade.ts',{'./lighting':lighting});
const input=new Float32Array(Array.from({length:16},()=>1));
const doc={lighting:{vignette:.5,vignetteFeather:.5,colorTemperature:0,toneMap:'reinhard'}};
const observed=[...grade.finishFrame(input,2,2,doc)];
const specByte=lighting.encodeSrgbByte(lighting.toneMap('reinhard',1)*.5);
if(observed[0]===specByte)throw Error('Expected order discriminator failed');
console.log(JSON.stringify({node:process.version,typescript:ts.version,status:'BLOCKED',detail:'GRADE_ORDER_MISMATCH',method:'Actual product modules transpiled in memory; no source edits',ms_sha:'db36db39821f46ec4b7057bb431ffb9e82473c33',radiance:1,vignette_multiplier:.5,mode:'reinhard',legacy_order:'temperature -> vignette -> toneMap -> encode',spec_6_2_order:'temperature -> toneMap -> vignette -> encode',actual_rgba:observed,spec_order_rgb_byte:specByte},null,2));
