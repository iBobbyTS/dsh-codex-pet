// Explicit PowerShell prerequisite; all installations target a disposable DSH_HOME.
import assert from 'node:assert/strict'
import {cpSync,mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join,resolve} from 'node:path'
import {execFileSync} from 'node:child_process'
const powershell=process.argv[2] ?? 'pwsh'
const scratch=mkdtempSync(join(tmpdir(),'pet-installers-'))
try {
 const candidate=join(scratch,'candidate');mkdirSync(candidate)
 mkdirSync(join(candidate,'lib'))
 for(const file of ['index.js','index.js.map','client.template.js','client.template.js.map'])cpSync(resolve('lib',file),join(candidate,'lib',file))
 for(const entry of ['package.json','build.js','packages/dsh-codex-pet','install-runtime.ps1','install-to-dsh.ps1','cordis-patch.ps1','dsh-home.ps1']) {
  cpSync(resolve(entry),join(candidate,entry),{recursive:true,filter:path=>!path.split('/').includes('node_modules')})
 }
 const atlas=Buffer.alloc(24);atlas.set([0x89,0x50,0x4e,0x47]);atlas.writeUInt32BE(1536,16);atlas.writeUInt32BE(2288,20)
 writeFileSync(join(candidate,'fixture-pet.png'),atlas)
 execFileSync(process.execPath,['build.js'],{cwd:candidate,stdio:'inherit'})
 const home=join(scratch,'home');mkdirSync(join(home,'profiles/web'),{recursive:true})
 const patch=join(home,'profiles/web/cordis.patch.yml');writeFileSync(patch,'# Fixture profile\n[]\n')
 for(const installer of ['install-runtime.ps1','install-to-dsh.ps1']) {
  for(let attempt=0;attempt<2;attempt++)execFileSync(powershell,['-NoProfile','-File',join(candidate,installer)],{cwd:candidate,env:{...process.env,DSH_HOME:home},stdio:'inherit'})
 }
 const installed=join(home,'profiles/node_modules')
 for(const file of ['lib/index.js','lib/client.js','lib/service.js','src/index.ts','assets'])assert.ok(readable(join(installed,'@signalight/dsh-codex-pet',file)),`runtime missing ${file}`)
 const petDir=join(installed,'fixture-pet')
 const host=readFileSync(join(petDir,'lib/index.js'),'utf8')
 assert.match(host,/sourceMappingURL=index\.js\.map/)
 const map=JSON.parse(readFileSync(join(petDir,'lib/index.js.map'),'utf8'))
 assert.ok(map.sources.length > 0)
 assert.ok(map.sources.every((_,index)=>typeof map.sourcesContent?.[index]==='string'), 'exported Host map must embed its sources')
 assert.ok(!readFileSync(join(petDir,'lib/client.js'),'utf8').includes('sourceMappingURL='), 'injected Client must not reference the template map')
 const exported=JSON.parse(readFileSync(join(installed,'fixture-pet/package.json'),'utf8'))
 assert.equal(exported.name,'fixture-pet');assert.equal(exported.main,'lib/index.js')
 for(const field of ['devDependencies','scripts','packageManager','private','workspaces'])assert.ok(!(field in exported),`development field copied: ${field}`)
 const body=readFileSync(patch,'utf8');assert.equal((body.match(/name: ['"]?@signalight\/dsh-codex-pet/g)??[]).length,1);assert.equal((body.match(/name: ['"]?fixture-pet/g)??[]).length,1)
 console.log('PASS: both PowerShell installers copy prebuilt files, export runtime-only metadata and remain idempotent in temporary home')
} finally {rmSync(scratch,{recursive:true,force:true})}
function readable(path){try {readFileSync(path);return true}catch(error){return error.code==='EISDIR'}}
