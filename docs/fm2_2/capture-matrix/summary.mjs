import fs from 'node:fs';import path from 'node:path';
const root='runs/fm2-2/capture-matrix',summary={};
for(const phase of ['m1-isolated','fm21-isolated','fm22-isolated','fm22-suite']){
 const dir=path.join(root,phase),records=fs.existsSync(dir)?fs.readdirSync(dir).filter(n=>n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync(path.join(dir,n),'utf8'))):[];
 summary[phase]={completed:records.length,totalRequested:20,passed:records.filter(r=>r.exitCode===0).length,repeatTestFailures:records.filter(r=>r.renderFailed).length,otherFailures:records.filter(r=>r.exitCode!==0&&!r.renderFailed).length,indices:records.map(r=>({index:r.index,exitCode:r.exitCode,renderFailed:r.renderFailed,events:r.events.map(e=>e.status)}))};
}
fs.writeFileSync(path.join(root,'summary.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));
