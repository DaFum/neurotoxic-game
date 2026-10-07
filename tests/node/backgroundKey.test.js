import assert from 'node:assert/strict'
import { test } from 'node:test'
import { clearEdgeBackground } from '../../src/utils/backgroundKey.ts'

/**
 * Builds an RGBA image from rows of single-character colour codes.
 */
const imageFrom = rows => {
  const palette = {
    W: [255, 255, 255],
    w: [240, 245, 238],
    K: [0, 0, 0],
    R: [200, 30, 30]
  }
  const height = rows.length
  const width = rows[0].length
  const data = new Uint8ClampedArray(width * height * 4)
  rows.forEach((row, y) => {
    ;[...row].forEach((code, x) => {
      const offset = (y * width + x) * 4
      data.set([...palette[code], 255], offset)
    })
  })
  return { data, width, height }
}

const alphaMap = ({ data, width, height }) =>
  Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) =>
      data[(y * width + x) * 4 + 3] === 0 ? '.' : '#'
    ).join('')
  )

test('clears a white field around a sprite and keeps the sprite', () => {
  const image = imageFrom(['WWWWW', 'WKKKW', 'WKRKW', 'WKKKW', 'WwWWW'])

  clearEdgeBackground(image.data, image.width, image.height)

  // The slightly off-white JPEG noise pixel is background too.
  assert.deepEqual(alphaMap(image), [
    '.....',
    '.###.',
    '.###.',
    '.###.',
    '.....'
  ])
})

test('keeps an enclosed area of the background colour opaque', () => {
  // A black van on a black field: the red outline encloses its black body.
  const image = imageFrom(['KKKKK', 'KRRRK', 'KRKRK', 'KRRRK', 'KKKKK'])

  clearEdgeBackground(image.data, image.width, image.height)

  assert.deepEqual(alphaMap(image), [
    '.....',
    '.###.',
    '.###.',
    '.###.',
    '.....'
  ])
})

test('leaves a buffer that is too small for its size untouched', () => {
  const data = new Uint8ClampedArray([255, 255, 255, 255])

  clearEdgeBackground(data, 2, 2)

  assert.deepEqual([...data], [255, 255, 255, 255])
})
