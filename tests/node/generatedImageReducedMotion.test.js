import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

const read = path => fs.readFile(new URL(path, import.meta.url), 'utf8')

test('GeneratedImagePanel keeps motion in CSS so reduced motion can disable it', async () => {
  const [panel, css] = await Promise.all([
    read('../../src/ui/shared/GeneratedImagePanel.tsx'),
    read('../../src/index.css')
  ])

  assert.ok(
    !/animation\s*:/.test(panel) && !/transition\s*:/.test(panel),
    'inline animation/transition styles outrank the reduced-motion rules'
  )

  const reduced = css
    .split('@media (prefers-reduced-motion: reduce) {')
    .slice(1)
    .join('\n')
  assert.match(reduced, /\.gen-image-skeleton\s*\{[^}]*animation:\s*none/)
  assert.match(reduced, /\.gen-image-img\s*\{[^}]*transition:\s*none/)
})
