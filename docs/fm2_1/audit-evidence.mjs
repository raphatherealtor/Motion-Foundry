import assert from 'node:assert/strict';import fs from 'node:fs';
const x=JSON.parse(fs.readFileSync('runs/fm2-1/accepted-gate/parity-gate.json','utf8'));
assert.equal(x.launches.length,5);
const pins={
 'paper-collage.build_tear':['5a2713e6accda1b560bf1195442eaf3f29b578c8f33d3a28710b98dca8be4f79','94d911f599f31136dc8fe8f86e9a81de0eb412de6a9f5737f07b768ae6012c91'],
 'editorial.cutout_pop':['e21c50775ca586164e0242d26b9650487159aa25173af58b3d821b48d8e7a95f','01fab7ca8c91082b39855016aa9cb08d38212a6de3e25098e62967bd8e7ba901']};
const summary={status:'BLOCKED',detail:'AA_EDGE_COUNT_EXCEEDS_APPROVED_BOUND',launches:5,positionAndDeltaPins:true,exactSuites:true,recipes:{}};
for(const launch of x.launches){
 assert.equal(launch.browser,'153.0.8010.12');
 for(const id of ['vox-doc.chart_explainer','m1-proof-recipe']){const r=launch.recipes[id];assert.equal(r.changedChannels,0);assert.equal(r.maxDelta,0);}
 for(const[id,pin]of Object.entries(pins)){
  const r=launch.recipes[id];assert.equal(r.diff_sha256,pin[0]);assert.equal(r.delta_sha256,pin[1]);
  assert.equal(r.maxDelta,1);assert.equal(r.deltaGte2,0);assert.ok(r.fraction<=.0002);assert.equal(r.onAaEdge,570);assert.equal(r.interiorUnderClip,7);assert.equal(r.interiorOutsideClip,0);assert.equal(r.changedPixels,577);
  summary.recipes[id]={edgePixels:r.onAaEdge,approvedEdgeMaximum:568,interiorUnderClip:r.interiorUnderClip,approvedInteriorMaximum:9,interiorOutsideClip:0,changedChannels:r.changedChannels,diff_sha256:r.diff_sha256,delta_sha256:r.delta_sha256};
 }
 const expected=[[0,0,255,255],[128,0,0,255],[64,0,128,255],[48,0,64,255]];
 assert.equal(launch.opacity.length,4);launch.opacity.forEach((c,i)=>{assert.equal(c.changedChannels,0);assert.deepEqual(c.gpuPixel,expected[i]);assert.deepEqual(c.legacyPixel,expected[i]);assert.equal(c.hash,x.launches[0].opacity[i].hash);});
}
fs.writeFileSync('runs/fm2-1/accepted-gate/independent-audit.json',JSON.stringify(summary,null,2));
console.log('All fixed map/delta pins and exact suites verified across five launches. Gate remains BLOCKED: 570 edge pixels exceed the approved 568.');
