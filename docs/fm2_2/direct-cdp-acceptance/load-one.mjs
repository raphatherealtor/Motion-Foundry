import fs from 'node:fs';import {render} from '../../../dist/src/render.js';
const scene=JSON.parse(fs.readFileSync('fixtures/m0-overflow/scene.json'));
const out=process.env.CDP_LOAD_DIR;const dir=await render(scene,out,true);
fs.writeFileSync(out+'/render.json',JSON.stringify({dir}));console.log('Uncached M0 render complete',dir);
