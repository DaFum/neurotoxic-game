import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'
import { validateSkills } from '../.agents/skills/skilltest/scripts/validate-skills.mjs'

const writeSkill = async (rootDir, name) => {
  const skillDir = path.join(rootDir, '.agents', 'skills', name)
  await fs.mkdir(skillDir, { recursive: true })
  const contents = [
    '---',
    `name: ${name}`,
    'description: Use when testing duplicate skill detection.',
    '---',
    '# Skill'
  ].join('\n')
  await fs.writeFile(path.join(skillDir, 'SKILL.md'), contents)
  return skillDir
}

test('validateSkills marks duplicates once per meta', async () => {
  const originalCwd = process.cwd()
  const tempRoot = await fs.mkdtemp(path.join(originalCwd, 'tmp-skilltest-'))
  const childDir = path.join(tempRoot, 'child')
  await fs.mkdir(childDir, { recursive: true })

  const duplicateName = 'duplicate-skill-test'
  await writeSkill(tempRoot, duplicateName)
  await writeSkill(childDir, duplicateName)

  try {
    process.chdir(childDir)
    const results = await validateSkills({ includeUserSkills: false })
    const duplicates = results.filter(meta => meta.name === duplicateName)
    assert.equal(duplicates.length, 2)
    duplicates.forEach(meta => {
      const matches = meta.errors.filter(
        error => error === 'Duplicate skill name detected.'
      )
      assert.equal(matches.length, 1)
    })
  } finally {
    process.chdir(originalCwd)
    await fs.rm(tempRoot, { recursive: true, force: true })
  }
})
