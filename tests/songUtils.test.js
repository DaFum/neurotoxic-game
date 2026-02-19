import test from 'node:test'
import assert from 'node:assert/strict'
import { getSongId } from '../src/utils/audio/songUtils.js'

test('getSongId returns the string when input is a string', () => {
  const input = 'test-song-id'
  const result = getSongId(input)
  assert.equal(result, 'test-song-id')
})

test('getSongId returns the id property when input is an object with id', () => {
  const input = { id: 'object-song-id', name: 'Test Song' }
  const result = getSongId(input)
  assert.equal(result, 'object-song-id')
})

test('getSongId returns undefined when input is an object without id', () => {
  const input = { name: 'Test Song' }
  const result = getSongId(input)
  assert.equal(result, undefined)
})

test('getSongId returns undefined when input is null', () => {
  const result = getSongId(null)
  assert.equal(result, undefined)
})

test('getSongId returns undefined when input is undefined', () => {
  const result = getSongId(undefined)
  assert.equal(result, undefined)
})

test('getSongId returns undefined for non-string non-object inputs', () => {
  assert.equal(getSongId(123), undefined)
  assert.equal(getSongId(true), undefined)
})
