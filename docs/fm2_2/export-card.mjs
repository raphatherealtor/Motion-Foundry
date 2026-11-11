import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire('/root/projects/motion-suite-m2/package.json'),{PNG}=require('pngjs');
const root='runs/fm2-2/stress',width=1080,height=1920;
for(const mode of ['off','static','temporal']){
 const data=fs.readFileSync(`${root}/${mode}.rgba`);fs.writeFileSync(`${root}/${mode}.png`,PNG.sync.write({width,height,data}));
 const mask=fs.readFileSync(`${root}/${mode}-clipping.mask`),rgba=Buffer.alloc(width*height*4);
 for(let i=0;i<mask.length;i++){rgba[4*i]=(mask[i]&9)?255:0;rgba[4*i+1]=(mask[i]&4)?255:0;rgba[4*i+2]=(mask[i]&10)?255:0;rgba[4*i+3]=255;}
 fs.writeFileSync(`${root}/${mode}-clipping.png`,PNG.sync.write({width,height,data:rgba}));
}
