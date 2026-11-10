import test from 'node:test';
import assert from 'node:assert/strict';
import AjvImport from 'ajv';
import {canonical,hash} from '../src/hash.js';
import {schemas} from '../src/schemas.js';
const Ajv=AjvImport as unknown as typeof AjvImport.default;
const ajv=new Ajv({strict:true});
ajv.addSchema({...schemas.ProposedOperation,$id:'urn:foundry:operation:0.1'});
test('all versioned schemas compile and survive JSON roundtrip',()=>{
 for(const [name,schema] of Object.entries(schemas)) {
 assert.deepEqual(JSON.parse(canonical(schema)),schema,name);
 if(name!=='ProposedOperation') assert.equal(typeof ajv.compile(schema),'function');
 }
});
test('canonical hashes are key-order independent and content sensitive',()=>{
 assert.equal(hash({b:2,a:{z:0,k:1}}),hash({a:{k:1,z:0},b:2}));
 assert.notEqual(hash([1,2]),hash([2,1]));
 assert.notEqual(hash({n:1}),hash({n:'1'}));
 assert.equal(hash({}), '44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a');
 for(const v of [NaN,Infinity,undefined,new Date()]) assert.throws(()=>canonical(v));
});
test('proposal roundtrip rejects malformed data',()=>{
 const validate=ajv.getSchema('foundry.repair_proposal/0.1')!;
 const proposal={schema:'foundry.repair_proposal/0.1',base_revision_id:hash({}),base_render_id:hash([]),rationale:'Wrap the title.',ops:[{op:'set',target:'objects.title_text.layout.wrap',value:true}]};
 assert.equal(validate(JSON.parse(canonical(proposal))),true,JSON.stringify(validate.errors));
 assert.equal(validate({...proposal,schema:'unknown'}),false);
 assert.equal(validate({...proposal,ops:[{op:'delete',target:'text',value:null}]}),false);
 assert.equal(validate({...proposal,unexpected:true}),false);
});
