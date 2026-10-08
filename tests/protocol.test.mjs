import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {dispatch,preview,REFERENCES,TOOLS} from '../src/server.mjs';
const call=(method,params={},id=1)=>dispatch({jsonrpc:'2.0',method,params,id});
test('MCP initializes with an explicitly mock identity',()=>{const r=call('initialize').result;assert.equal(r.protocolVersion,'2025-06-18');assert.equal(r.serverInfo.name,'videira-community-offline-example')});
test('only read-only tools are advertised',()=>{assert.equal(TOOLS.length,2);for(const t of TOOLS){assert.equal(t.annotations.readOnlyHint,true);assert.equal(t.inputSchema.additionalProperties,false)}});
test('four public references are linked without copying source',()=>{assert.deepEqual(REFERENCES.map(s=>s.id),['superpowers','karpathy','actions','council'])});
test('four task kinds fail closed and never claim approval',()=>{for(const kind of ['research','design','code','security']){const r=preview(kind);assert.equal(r.productionReady,false);assert.equal(r.providerCalls,0);assert.equal(r.externalDataSent,false);assert.equal(r.approval,'NOT_GRANTED');assert.equal(r.steps.length,4)}});
test('unknown methods and unauthorized calls are rejected',()=>{assert.equal(call('git/push').error.code,-32601);assert.equal(call('tools/call',{name:'exec'}).error.code,-32601);for(const args of [{},{kind:'deploy'},{kind:'code',extra:'secret'}])assert.equal(call('tools/call',{name:'videira_example_plan',arguments:args}).error.code,-32602)});
test('capabilities are synthetic and accept no input',()=>{const r=JSON.parse(call('tools/call',{name:'videira_example_capabilities',arguments:{}}).result.content[0].text);assert.equal(r.network,false);assert.equal(r.deviceAccess,false);assert.equal(call('tools/call',{name:'videira_example_capabilities',arguments:{password:'no'}}).error.code,-32602)});
test('invalid JSON-RPC and notifications are safe',()=>{assert.equal(dispatch({jsonrpc:'2.0',method:'notifications/initialized'}),null);assert.equal(dispatch({jsonrpc:'1.0',id:1,method:'initialize'}).error.code,-32600)});
test('stdio processing emits only JSON-RPC messages',()=>{
const events=[{jsonrpc:'2.0',id:1,method:'initialize'},{jsonrpc:'2.0',method:'notifications/initialized'},{jsonrpc:'2.0',id:2,method:'tools/list'},{jsonrpc:'2.0',id:3,method:'tools/call',params:{name:'videira_example_plan',arguments:{kind:'security'}}}];
const p=spawnSync(process.execPath,['src/server.mjs'],{input:events.map(JSON.stringify).join('\n')+'\n',encoding:'utf8',timeout:5000});
assert.equal(p.status,0,p.stderr);const lines=p.stdout.trim().split('\n').map(JSON.parse);assert.deepEqual(lines.map(x=>x.id),[1,2,3]);assert.equal(JSON.parse(lines[2].result.content[0].text).productionReady,false);
});
test('oversized and malformed requests do not execute tools',()=>{
const p=spawnSync(process.execPath,['src/server.mjs'],{input:'X'.repeat(65537)+'\n{\n',encoding:'utf8',timeout:5000});assert.equal(p.status,0);assert.deepEqual(p.stdout.trim().split('\n').map(x=>JSON.parse(x).error.code),[-32600,-32700]);
});
