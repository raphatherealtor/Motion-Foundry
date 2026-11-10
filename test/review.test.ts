import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {probe} from '../src/review.js';
import {read} from '../src/io.js';
test('missing CLI and disabled vision fail closed without calls',()=>{
 const dir=mkdtempSync(tmpdir()+'/foundry-probe-');process.env.FOUNDRY_VISION='off';
 try {const providers=probe(dir,['foundry-nonexistent-cli']);const c=read(dir+'/capabilities.json');
 assert.equal(providers[0].installed,false);assert.equal(providers[0].may_incur_spend,true);assert.equal(providers[0].cli_image_transport,'UNSUPPORTED');
 assert.equal(c.perceptual_review,'BLOCKED');assert.equal(c.closed_loop,'UNREVIEWED');assert.equal(c.spend_incurred,0);
 } finally{delete process.env.FOUNDRY_VISION}
});
