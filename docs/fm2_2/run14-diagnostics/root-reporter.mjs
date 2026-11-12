import {tagArtifacts} from '../../../tooling/capture-observer/outcomes.mjs';
export function collectFailure(groups,data){
 const chain=[],seen=new Set();let error=data.details?.error;
 while(error&&!seen.has(error)){seen.add(error);chain.push({name:error.name??null,message:String(error.message??error),stack:error.stack??null,code:error.code??null,failureType:error.failureType??null});error=error.cause;}
 const upstream=chain.some(e=>e.failureType==='hookFailed'||/UPSTREAM_FAILED|upstream failed:/.test(e.message));
 const root=chain.at(-1)??{message:'Unknown failure',stack:null};
 const key=upstream?JSON.stringify([data.file,root.message,root.stack]):JSON.stringify([data.file,data.name,data.testNumber]);
 let group=groups.get(key);if(!group){group={kind:upstream?'upstream_setup':'independent_test',file:data.file??null,message:root.message,stack:root.stack,errorChain:chain,dependentTests:[]};groups.set(key,group);}
 group.dependentTests.push({name:data.name,status:'FAIL',detail:upstream?'upstream failed: '+data.file+' shared setup; dependent body did not run':'TEST_FAILED'});
}
export default async function* reporter(source){
 const groups=new Map(),outcomes=[];for await(const event of source){if(event.type==='test:fail')collectFailure(groups,event.data);if(['test:fail','test:pass'].includes(event.type))outcomes.push({file:event.data.file,name:event.data.name,status:event.type==='test:pass'?'expected':'failure'});}
 const artifacts=tagArtifacts(process.env.FOUNDRY_CAPTURE_FAILURE_DIR,outcomes);
 const roots=[...groups.values()];yield JSON.stringify({artifacts,rootFailureCount:roots.length,upstreamRootFailureCount:roots.filter(g=>g.kind==='upstream_setup').length,dependentFailureCount:roots.filter(g=>g.kind==='upstream_setup').reduce((n,g)=>n+g.dependentTests.length,0),roots},null,2)+'\n';
}
