import assert from 'node:assert'
import { test } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const mainMenuPath = path.join(__dirname, '../src/scenes/MainMenu.jsx')

test('MainMenu starts ambient audio on tour start', async t => {
  await t.test('Start Tour uses startAmbient', () => {
    const source = fs.readFileSync(mainMenuPath, 'utf8')
    assert.ok(
      source.includes('startAmbient'),
      'MainMenu should call audioManager.startAmbient() on Start Tour flow.'
    )
  })

  await t.test('Start Tour and Load flows both trigger startAmbient', () => {
    const source = fs.readFileSync(mainMenuPath, 'utf8')
    const occurrences = source.split('startAmbient').length - 1
    assert.ok(
      occurrences >= 2,
      'MainMenu should call audioManager.startAmbient() for Start Tour and Load flows.'
    )
  })
})
