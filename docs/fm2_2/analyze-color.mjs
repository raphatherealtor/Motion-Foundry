import fs from 'node:fs';
import {colorPerception} from '../../dist/src/fm2/color/perception.js';
import {banding,negativeControl} from '../../dist/src/fm2/color/banding.js';
import {profileCapabilities} from '../../dist/src/fm2/color/profile.js';
const root='runs/fm2-2/stress',w=1080,h=1920;
const raw=fs.readFileSync(`${root}/linear.f32`),linear=new Float32Array(raw.buffer,raw.byteOffset,raw.length/4);
const regions=['horizontal_linear','radial_vignette','navy_black','skin_tone'].map((id,i)=>({id,x:0,y:i*480,width:w,height:480,channel:i===2?2:0}));
fs.writeFileSync(`${root}/render_caps.json`,JSON.stringify(profileCapabilities([{id:'synthetic-linear-card',profile:'srgb'}]),null,2));
const validations={};
for(const mode of ['off','static','temporal']){
 const pixels=fs.readFileSync(`${root}/${mode}.rgba`),p=colorPerception(linear,pixels,w,h);
 validations[mode]=banding(pixels,p.expected,w,h,regions,`gradient:${mode}`);
 fs.writeFileSync(`${root}/${mode}-perception.json`,JSON.stringify({histograms:p.histograms,counts:p.counts,maskLegend:p.maskLegend},null,2));
 fs.writeFileSync(`${root}/${mode}-clipping.mask`,p.mask);
}
const result={width:w,height:h,validations,gate:negativeControl(validations.temporal,validations.off)};
fs.writeFileSync(`${root}/banding-results.json`,JSON.stringify(result,null,2));
for(const [mode,v] of Object.entries(validations))console.log(mode,v.status,JSON.stringify(v.params.metrics));
console.log('GATE',result.gate.status);
process.exitCode=result.gate.status==='PASS'?0:1;
