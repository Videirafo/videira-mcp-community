#!/usr/bin/env node
// Synthetic, read-only MCP example; no production implementation.
import readline from 'node:readline';
export const PROTOCOL='2025-06-18';
export const REFERENCES=Object.freeze([
{id:'superpowers',repo:'obra/superpowers',concept:'Specification and test-first delivery'},
{id:'karpathy',repo:'multica-ai/andrej-karpathy-skills',concept:'Minimal changes and explicit assumptions'},
{id:'actions',repo:'ayghri/i-have-adhd',concept:'Concrete next steps and measurable progress'},
{id:'council',repo:'nyldn/claude-octopus',concept:'Record disagreement and obtain human review'}]);
const KINDS=['research','design','code','security'];
export const TOOLS=Object.freeze([
{name:'videira_example_capabilities',description:'Synthetic example metadata only. No production connection.',annotations:{readOnlyHint:true,idempotentHint:true,openWorldHint:false},inputSchema:{type:'object',properties:{},additionalProperties:false}},
{name:'videira_example_plan',description:'Synthetic plan based on four public methodology references; no providers.',annotations:{readOnlyHint:true,idempotentHint:true,openWorldHint:false},inputSchema:{type:'object',properties:{kind:{type:'string',enum:KINDS}},required:['kind'],additionalProperties:false}}]);
export function preview(kind){
if(typeof kind!=='string'||!KINDS.includes(kind))throw Error('Unsupported mock kind');
const actions={
superpowers:'Write specification and a failing test before implementation.',
karpathy:'Minimize changes and document assumptions.',
actions:'Provide one next step and a verifiable completion condition.',
council:'Surface independent objections; ask a human to decide.'};
return {mode:'SIMULATED_ONLY',kind,productionReady:false,providerCalls:0,externalDataSent:false,
requiresHumanReview:true,approval:'NOT_GRANTED',
sources:REFERENCES.map(s=>({...s,url:'https://github.com/'+s.repo})),
steps:REFERENCES.map((s,i)=>({number:i+1,pattern:s.id,action:actions[s.id]}))};
}
export function dispatch(msg){
if(!msg||typeof msg!=='object'||Array.isArray(msg)||msg.jsonrpc!=='2.0'||typeof msg.method!=='string')return{jsonrpc:'2.0',id:msg?.id??null,error:{code:-32600,message:'Invalid request'}};
if(msg.id===undefined||msg.id===null)return null;
const id=msg.id,ok=result=>({jsonrpc:'2.0',id,result}),fail=(code,message)=>({jsonrpc:'2.0',id,error:{code,message}});
if(msg.method==='initialize')return ok({protocolVersion:PROTOCOL,capabilities:{tools:{}},serverInfo:{name:'videira-community-offline-example',version:'0.1.0'}});
if(msg.method==='ping')return ok({});
if(msg.method==='tools/list')return ok({tools:TOOLS});
if(msg.method!=='tools/call')return fail(-32601,'Method not found');
const name=msg.params?.name,args=msg.params?.arguments??{};
if(args===null||typeof args!=='object'||Array.isArray(args))return fail(-32602,'Invalid input');
const keys=Object.keys(args);
if(name==='videira_example_capabilities'&&keys.length===0)return ok({content:[{type:'text',text:JSON.stringify({simulation:true,production:false,network:false,deviceAccess:false,tools:TOOLS.map(t=>t.name)})}]});
if(name==='videira_example_plan'&&keys.length===1&&keys[0]==='kind'&&KINDS.includes(args.kind))return ok({content:[{type:'text',text:JSON.stringify(preview(args.kind))}]});
if(TOOLS.some(t=>t.name===name))return fail(-32602,'Invalid sample input');
return fail(-32601,'Tool not found');
}
export async function start(io={input:process.stdin,output:process.stdout}){
const rl=readline.createInterface({input:io.input,crlfDelay:Infinity,terminal:false});
let count=0;
for await(const line of rl){
if(++count>100)break;
if(Buffer.byteLength(line,'utf8')>65536){io.output.write(JSON.stringify({jsonrpc:'2.0',id:null,error:{code:-32600,message:'Request too large'}})+'\n');continue;}
let msg;try{msg=JSON.parse(line)}catch{io.output.write(JSON.stringify({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Parse error'}})+'\n');continue;}
const response=dispatch(msg);if(response!==null)io.output.write(JSON.stringify(response)+'\n');
}
}
if(process.argv[1]?.endsWith('/server.mjs'))start().catch(()=>process.exitCode=1);
