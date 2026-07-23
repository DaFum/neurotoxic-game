import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const localeRoot = path.join(process.cwd(), 'public', 'locales')
const languages = ['en', 'de']

const collectKeys = (value, prefix = '') => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [prefix]
  }
  return Object.keys(value).flatMap(key =>
    collectKeys(value[key], prefix ? `${prefix}.${key}` : key)
  )
}

const scanString = (source, index) => {
  let i = index + 1
  while (i < source.length) {
    const char = source[i]
    if (char === '\\') {
      i += 2
      continue
    }
    if (char === '"') {
      return i + 1
    }
    i += 1
  }
  throw new Error('unterminated JSON string')
}

const skipWhitespace = (source, index) => {
  let i = index
  while (/\s/.test(source[i] ?? '')) i += 1
  return i
}

const currentObjectFrame = stack => {
  const frame = stack[stack.length - 1]
  return frame?.type === 'object' ? frame : null
}

const duplicateKeysInJson = source => {
  const duplicates = []
  const stack = []
  let expectingKey = false
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i]
    if (char === '"') {
      const end = scanString(source, i)
      const frame = currentObjectFrame(stack)
      if (expectingKey && frame) {
        const key = JSON.parse(source.slice(i, end))
        if (frame.keys.has(key)) duplicates.push(key)
        frame.keys.add(key)
        expectingKey = false
      }
      i = end - 1
      continue
    }
    if (char === '{') {
      stack.push({ type: 'object', keys: new Set() })
      expectingKey = true
      continue
    }
    if (char === '[') {
      stack.push({ type: 'array' })
      expectingKey = false
      continue
    }
    if (char === '}' || char === ']') {
      stack.pop()
      expectingKey = false
      continue
    }
    if (char === ',') {
      const next = skipWhitespace(source, i + 1)
      expectingKey = Boolean(currentObjectFrame(stack)) && source[next] === '"'
      continue
    }
    if (char === ':') {
      expectingKey = false
    }
  }
  JSON.parse(source)
  return duplicates
}

describe('locale integrity', () => {
  it('keeps EN and DE namespaces in key parity', () => {
    const enFiles = fs
      .readdirSync(path.join(localeRoot, 'en'))
      .filter(file => file.endsWith('.json'))
      .sort()
    const deFiles = fs
      .readdirSync(path.join(localeRoot, 'de'))
      .filter(file => file.endsWith('.json'))
      .sort()

    assert.deepEqual(deFiles, enFiles)

    for (const file of enFiles) {
      const byLanguage = Object.fromEntries(
        languages.map(language => {
          const parsed = JSON.parse(
            fs.readFileSync(path.join(localeRoot, language, file), 'utf8')
          )
          return [language, collectKeys(parsed).sort()]
        })
      )
      assert.deepEqual(byLanguage.de, byLanguage.en, file)
    }
  })

  it('does not contain duplicate locale object keys', () => {
    for (const language of languages) {
      const dir = path.join(localeRoot, language)
      for (const file of fs
        .readdirSync(dir)
        .filter(name => name.endsWith('.json'))) {
        const source = fs.readFileSync(path.join(dir, file), 'utf8')
        const duplicates = duplicateKeysInJson(source)
        assert.deepEqual(duplicates, [], `${language}/${file}`)
      }
    }
  })
})
