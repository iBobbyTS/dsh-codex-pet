import {build} from 'tsdown'
import {rmSync} from 'node:fs'
for (const file of ['lib/index.js','lib/index.js.map','lib/client.template.js','lib/client.template.js.map']) rmSync(file,{force:true})
rmSync('packages/dsh-codex-pet/lib',{recursive:true,force:true})
const host = {platform:'node',format:'esm',outExtensions:()=>({js:'.js'}),target:'node22',sourcemap:true,clean:false,dts:false,deps:{neverBundle:[/.*/]}}
await build({...host,entry:['src/index.ts'],outDir:'lib',root:'src'})
await build({...host,entry:['packages/dsh-codex-pet/src/index.ts','packages/dsh-codex-pet/src/registry.ts','packages/dsh-codex-pet/src/routes.ts','packages/dsh-codex-pet/src/service.ts'],root:'packages/dsh-codex-pet/src',outDir:'packages/dsh-codex-pet/lib',unbundle:true})
const client = {platform:'browser',format:'cjs',target:'es2022',sourcemap:true,clean:false,dts:false,deps:{neverBundle:['react','react-dom','react/jsx-runtime']}}
await build({...client,entry:['packages/dsh-codex-pet/src/client.ts'],outDir:'packages/dsh-codex-pet/lib',outputOptions:{entryFileNames:'client.js',banner:'window.__ModuleLoader__.load({id:"@signalight/dsh-codex-pet",factory:(require)=>{',intro:'var module={exports:{}};var exports=module.exports;',footer:'return module.exports;}});'}})
await build({...client,entry:['src/client.template.ts'],outDir:'lib',outputOptions:{entryFileNames:'client.template.js',banner:'(function(){const CONFIG_DATA=__CONFIG_JSON__;window.__ModuleLoader__.load({id:CONFIG_DATA.name || "codex-to-dsh-pet",factory:(require)=>{',intro:'var module={exports:{}};var exports=module.exports;',footer:'return module.exports;}});})();'}})
