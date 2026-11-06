import assert from 'node:assert/strict'
import {cpSync,mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {execFileSync} from 'node:child_process'
import {runInNewContext} from 'node:vm'
const root = mkdtempSync(join(tmpdir(),'pet-export-'))
try {
 for (const version of [1,2]) {
  const dir=join(root,String(version));mkdirSync(join(dir,'lib'),{recursive:true})
  for (const file of ['build.js','package.json','lib/client.template.js','lib/index.js']) cpSync(file,join(dir,file))
  const atlas=Buffer.alloc(24);atlas.set([0x89,0x50,0x4e,0x47]);atlas.writeUInt32BE(1536,16);atlas.writeUInt32BE(version===1?1872:2288,20)
  writeFileSync(join(dir,'fixture-pet.png'),atlas)
  execFileSync(process.execPath,['build.js'],{cwd:dir,stdio:'inherit'})
  const config=JSON.parse(readFileSync(join(dir,'config.effective.json'),'utf8'))
  assert.equal(config.name,'fixture-pet');assert.equal(config.spriteVersionNumber,version)
  const output=readFileSync(join(dir,'lib/client.js'),'utf8');assert.ok(output.includes('data:image/png;base64,'));assert.ok(!output.includes('sourceMappingURL='))
  let registration;runInNewContext(output,{window:{__ModuleLoader__:{load(spec){registration=spec}}}})
  assert.equal(registration.id,config.name);assert.equal(typeof registration.factory,'function')
 }
 const installer=readFileSync('install-to-dsh.ps1','utf8')
 assert.ok(installer.includes('$runtimeManifest'));assert.ok(!installer.includes("Copy-Item (Join-Path $workspace 'package.json')"))
 assert.ok(readFileSync('install-runtime.ps1','utf8').includes("Join-Path $pkgDir 'lib'"))
 console.log('PASS: v1/v2 synthetic exporter, package identity and map removal; installer file-selection contract')
} finally {rmSync(root,{recursive:true,force:true})}
