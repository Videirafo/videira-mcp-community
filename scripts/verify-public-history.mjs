import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

export const APPROVED_ROOT='aec16f13f28aa3ce6836f84fa3442eb8616181dd';
const MAX_BLOBS=2000,MAX_BLOB_BYTES=2_000_000,MAX_TOTAL_BYTES=25_000_000;
const FILE_DENY=/(?:^|\/)(?:\.env(?:\..*)?|\.ssh|secrets?|backups?|logs?|credential[^/]*|[^/]*\.(?:pem|p12|pfx|key|sqlite|db))$/i;
const SECRET_PATTERNS=[
  /-----BEGIN (?:OPENSSH |RSA |EC |DSA )?PRIVATE KEY-----/,
  /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{55,})\b/,
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
  /\bAIza[0-9A-Za-z_-]{35}\b/,
  /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{25,}\b/,
  /\b(?:sk_live_|rk_live_)[A-Za-z0-9]{24,}\b/,
];
export function evaluatePublicHistory({roots,files,blobs,approvedPaths,retiredPaths=[]}){
  const problems=[];
  if(!Array.isArray(roots)||roots.length!==1||roots[0]!==APPROVED_ROOT)
    problems.push('UNTRUSTED_GIT_ROOT');
  if(!Array.isArray(files)||!Array.isArray(blobs)||!Array.isArray(approvedPaths)||
     !Array.isArray(retiredPaths))return {ok:false,reason:'MALFORMED_AUDIT_INPUT'};
  const allowed=new Set([...approvedPaths,...retiredPaths,'manifest/public-files.json']);
  for(const f of files){
    if(typeof f!=='string'||FILE_DENY.test(f))problems.push('FORBIDDEN_HISTORY_PATH');
    else if(!allowed.has(f))problems.push('UNAPPROVED_HISTORY_PATH');
  }
  if(blobs.length>MAX_BLOBS)problems.push('TOO_MANY_HISTORY_BLOBS');
  let bytes=0;
  for(const blob of blobs){
    const content=blob?.content;
    if(typeof content!=='string'){problems.push('INVALID_HISTORY_BLOB');continue;}
    const size=Buffer.byteLength(content,'utf8');bytes+=size;
    if(size>MAX_BLOB_BYTES||bytes>MAX_TOTAL_BYTES)problems.push('HISTORY_TOO_LARGE');
    if(content.includes('\u0000'))problems.push('BINARY_HISTORY_BLOB');
    if(SECRET_PATTERNS.some(re=>re.test(content)))problems.push('CREDENTIAL_PATTERN_IN_HISTORY');
  }
  return {ok:problems.length===0,reason:problems[0]??'CLOSED_CORPUS_PASS',scannedPaths:files.length,scannedBlobs:blobs.length};
}

function git(args,input=null){
  const p=spawnSync('git',args,{input,encoding:'utf8',maxBuffer:8_000_000,timeout:15000});
  if(p.status!==0)throw Error('Git audit failed');
  return p.stdout.trim();
}
export function auditRepository(root){
  const roots=git(['-C',root,'rev-list','--max-parents=0','--all']).split('\n').filter(Boolean);
  const files=[...new Set(git(['-C',root,'log','--all','--format=','--name-only']).split('\n').filter(Boolean))];
  const objects=git(['-C',root,'rev-list','--objects','--all']).split('\n').map(s=>s.split(' ')[0]);
  const response=git(['-C',root,'cat-file','--batch-check=%(objectname) %(objecttype) %(objectsize)'],objects.join('\n')+'\n');
  const blobItems=response.split('\n').map(s=>s.split(' ')).filter(s=>s[1]==='blob');
  if(blobItems.length>MAX_BLOBS||blobItems.some(b=>Number(b[2])>MAX_BLOB_BYTES))
    return {ok:false,reason:'UNBOUNDED_HISTORY'};
  const manifest=JSON.parse(readFileSync(join(root,'manifest/public-files.json'),'utf8'));
  const approvedPaths=manifest.files?.map(f=>f.path);
  const retiredPaths=manifest.historicalAllowedPaths??[];
  let total=0;
  const blobs=[];
  for(const [oid,,length] of blobItems){
    total+=Number(length);
    if(total>MAX_TOTAL_BYTES)return {ok:false,reason:'UNBOUNDED_HISTORY'};
    const buffer=execFileSync('git',['-C',root,'cat-file','blob',oid],{maxBuffer:MAX_BLOB_BYTES+1024,timeout:10000});
    if(buffer.includes(0))return {ok:false,reason:'BINARY_HISTORY_BLOB'};
    blobs.push({content:buffer.toString('utf8')});
  }
  return evaluatePublicHistory({roots,files,blobs,approvedPaths,retiredPaths});
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  let result;
  try{result=auditRepository(process.cwd());}
  catch{result={ok:false,reason:'GIT_HISTORY_AUDIT_UNAVAILABLE'};}
  console.log(JSON.stringify({status:result.ok?'PASS':'BLOCKED',reason:result.reason,paths:result.scannedPaths??null,blobs:result.scannedBlobs??null}));
  if(!result.ok)process.exitCode=1;
}
