/**
 * Unit tests for the pet registry: source scanning (built-in / Codex / user),
 * v1-v2 atlas detection and the 'codexPets' switch. Everything runs against
 * temp directories, so the real '~/.codex/pets' is never touched.
 * @module dsh-codex-pet/test/registry
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { codexPetsDir, loadPetRegistry, petEntryView } from '../lib/registry.js'

/** Write '<root>/<id>/pet.json' plus a (non-image) atlas file. */
function writePet(root, id, manifest = {}) {
  const dir = join(root, id)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'pet.json'), JSON.stringify({
    id,
    displayName: id,
    spritesheetPath: 'sheet.webp',
    ...manifest,
  }))
  writeFileSync(join(dir, 'sheet.webp'), Buffer.from('not a real image'))
  return dir
}

/** Temp package root + Codex dir + user pets dir. */
function tempRoots() {
  const root = mkdtempSync(join(tmpdir(), 'codex-pet-registry-'))
  const packageRoot = join(root, 'pkg')
  const codexDir = join(root, 'codex-pets')
  const petsDir = join(root, 'my-pets')
  mkdirSync(join(packageRoot, 'assets'), { recursive: true })
  mkdirSync(codexDir, { recursive: true })
  mkdirSync(petsDir, { recursive: true })
  return { packageRoot, codexDir, petsDir }
}

test('codexPetsDir honours CODEX_HOME and falls back to ~/.codex', () => {
  assert.equal(codexPetsDir({ CODEX_HOME: 'D:/codex-home' }, 'C:/Users/x'), join('D:/codex-home', 'pets'))
  assert.equal(codexPetsDir({ CODEX_HOME: '   ' }, 'C:/Users/x'), join('C:/Users/x', '.codex', 'pets'))
  assert.equal(codexPetsDir({}, 'C:/Users/x'), join('C:/Users/x', '.codex', 'pets'))
})

test('loadPetRegistry reads Codex pets in place and tags every source', () => {
  const { packageRoot, codexDir, petsDir } = tempRoots()
  writePet(join(packageRoot, 'assets'), 'builtin-one', { spriteVersionNumber: 1 })
  writePet(codexDir, 'codex-v1', { spriteVersionNumber: 1 })
  writePet(codexDir, 'codex-v2', { spriteVersionNumber: 2 })
  writePet(petsDir, 'mine-one')

  const registry = loadPetRegistry({ packageRoot, codexPetsDir: codexDir, petsDir })
  const byId = Object.fromEntries(registry.entries.map((entry) => [entry.id, entry]))
  assert.equal(byId['builtin-one'].source, 'builtin')
  assert.equal(byId['codex-v1'].source, 'codex')
  assert.equal(byId['codex-v2'].source, 'codex')
  assert.equal(byId['mine-one'].source, 'user')
  // Explicit versions win; the v1/v2 row counts follow from them.
  assert.equal(byId['codex-v1'].spriteVersionNumber, 1)
  assert.equal(byId['codex-v1'].rows, 9)
  assert.equal(byId['codex-v2'].spriteVersionNumber, 2)
  assert.equal(byId['codex-v2'].rows, 11)
  // An unreadable atlas falls back to v2 instead of dropping the pet.
  assert.equal(byId['mine-one'].spriteVersionNumber, 2)
  // Codex pets are served from their own directory, so no copy is needed.
  assert.equal(byId['codex-v1'].dir, join(codexDir, 'codex-v1'))
  assert.equal(byId['codex-v1'].atlasUrl, '/codex-pet/codex-v1/sheet.webp')
  assert.equal(registry.codexPetsDir, codexDir)
  assert.equal(registry.codexPets, true)
  assert.equal(petEntryView(byId['codex-v2']).source, 'codex')
})

test('the codexPets switch leaves Codex pets out of the registry', () => {
  const { packageRoot, codexDir, petsDir } = tempRoots()
  writePet(join(packageRoot, 'assets'), 'builtin-one', { spriteVersionNumber: 1 })
  writePet(codexDir, 'codex-v1', { spriteVersionNumber: 1 })
  writePet(petsDir, 'mine-one')

  const off = loadPetRegistry({ packageRoot, codexPetsDir: codexDir, petsDir, codexPets: false })
  assert.deepEqual(off.entries.map((entry) => entry.id).sort(), ['builtin-one', 'mine-one'])
  assert.equal(off.entries.filter((entry) => entry.source === 'codex').length, 0)
  assert.equal(off.codexPets, false)
})

test('a user pet overrides a Codex pet with the same id', () => {
  const { packageRoot, codexDir, petsDir } = tempRoots()
  writePet(codexDir, 'dup', { displayName: 'from codex', spriteVersionNumber: 1 })
  writePet(petsDir, 'dup', { displayName: 'from user', spriteVersionNumber: 1 })

  const registry = loadPetRegistry({ packageRoot, codexPetsDir: codexDir, petsDir })
  assert.equal(registry.byId('dup').displayName, 'from user')
  assert.equal(registry.byId('dup').source, 'user')
})
