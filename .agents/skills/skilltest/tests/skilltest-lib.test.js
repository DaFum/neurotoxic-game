import assert from 'node:assert/strict'
import path from 'node:path'
import { test } from 'node:test'
import { buildReport, parseFrontmatter } from '../scripts/skilltest-lib.mjs'

test('parseFrontmatter reads only leading frontmatter', () => {
  const contents = [
    'Intro text',
    '---',
    'name: late-skill',
    'description: Use when validating a late frontmatter block.',
    '---'
  ].join('\n')
  const meta = parseFrontmatter(contents)
  assert.equal(meta, null)
})

test('parseFrontmatter reads valid frontmatter', () => {
  const contents = [
    '---',
    'name: sample-skill',
    'description: Use when validating frontmatter parsing.',
    '---',
    '# Body'
  ].join('\n')
  const meta = parseFrontmatter(contents)
  assert.deepEqual(meta, {
    name: 'sample-skill',
    description: 'Use when validating frontmatter parsing.'
  })
})

test('buildReport matches disabled entries by normalized path', () => {
  const cwd = process.cwd()
  const disabled = new Set([path.join(cwd, 'foo')])
  const records = [
    {
      name: 'foo-skill',
      skillDir: path.join(cwd, 'foo'),
      skillFile: path.join(cwd, 'foo', 'SKILL.md'),
      findings: []
    },
    {
      name: 'foobar-skill',
      skillDir: path.join(cwd, 'foobar'),
      skillFile: path.join(cwd, 'foobar', 'SKILL.md'),
      findings: []
    }
  ]

  const report = buildReport(records, [], disabled)

  const foo = report.skills.find(skill => skill.name === 'foo-skill')
  const foobar = report.skills.find(skill => skill.name === 'foobar-skill')
  assert.equal(foo.status, 'disabled')
  assert.equal(foobar.status, 'pass')
})
