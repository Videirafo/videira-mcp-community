import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluatePublicHistory,APPROVED_ROOT,auditRepository} from '../scripts/verify-public-history.mjs';
const input={roots:[APPROVED_ROOT],files:['README.md','src/server.mjs'],blobs:[{content:'synthetic public docs'}],approvedPaths:['README.md','src/server.mjs']};
test('independently authored root, allowlisted files and safe blobs accepted',()=>{
 const r=evaluatePublicHistory(input);
 assert.equal(r.ok,true);
 assert.equal(r.reason,'CLOSED_CORPUS_PASS');
});
test('additional git root fails closed, even when tree currently clean',()=>{
 assert.equal(evaluatePublicHistory({...input,roots:[APPROVED_ROOT,'b'.repeat(40)]}).ok,false);
 assert.equal(evaluatePublicHistory({...input,roots:['b'.repeat(40)]}).ok,false);
});
test('historical private-looking path fails even if later deleted',()=>{
 for(const f of ['.env','.env.production','secrets/app','backups/archive.json','logs/server','keys.pem','foo/config.sqlite']){
  assert.equal(evaluatePublicHistory({...input,files:[...input.files,f]}).ok,false,f);
 }
});
test('every historical file requires provenance allowlist, even after deletion',()=>{
 assert.equal(evaluatePublicHistory({...input,files:[...input.files,'src/previous.mjs']}).ok,false);
 assert.equal(evaluatePublicHistory({...input,files:[...input.files,'src/previous.mjs'],retiredPaths:['src/previous.mjs']}).ok,true);
});
test('credentials in reachable git blob fail even when not in working tree',()=>{
 const fake=['ghp_','A'.repeat(40)].join('');
 const x=evaluatePublicHistory({...input,blobs:[...input.blobs,{content:fake}]});
 assert.equal(x.ok,false);assert.equal(x.reason,'CREDENTIAL_PATTERN_IN_HISTORY');
});
test('historical binary and oversized blobs fail',()=>{
 assert.equal(evaluatePublicHistory({...input,blobs:[{content:'binary\u0000file'}]}).ok,false);
 assert.equal(evaluatePublicHistory({...input,blobs:[{content:'x'.repeat(2_000_001)}]}).ok,false);
});
test('malformed or too-large history inventory rejects',()=>{
 assert.equal(evaluatePublicHistory({...input,files:null}).ok,false);
 assert.equal(evaluatePublicHistory({...input,blobs:Array(2001).fill({content:'ok'})}).ok,false);
});
test('current repository history is rooted in explicitly approved original commit',()=>{
 const result=auditRepository(process.cwd());
 assert.equal(result.ok,true,result.reason);
});
