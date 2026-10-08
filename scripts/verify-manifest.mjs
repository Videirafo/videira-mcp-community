import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join,relative,resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'..');
const manifest=JSON.parse(readFileSync(join(root,'manifest/public-files.json'),'utf8'));
const expected=new Map(manifest.files.map(v=>[v.path,v.sha256]));
function walk(d){return readdirSync(d).flatMap(name=>{
if(name==='.git'||name==='node_modules')return [];
const p=join(d,name);return statSync(p).isDirectory()?walk(p):[relative(root,p).replaceAll('\\','/')];
});}
const actual=walk(root).filter(p=>p!=='manifest/public-files.json');
const problems=[];
for(const p of actual){const sha=createHash('sha256').update(readFileSync(join(root,p))).digest('hex');if(expected.get(p)!==sha)problems.push('mismatch or unexpected: '+p);}
for(const p of expected.keys())if(!actual.includes(p))problems.push('missing: '+p);
console.log(JSON.stringify({origin:'new-source-only',checkedFiles:actual.length,manifestEntries:expected.size,status:problems.length?'BLOCKED':'PASS',problems:problems.slice(0,8)}));
if(problems.length)process.exitCode=1;
