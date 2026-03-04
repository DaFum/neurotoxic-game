import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Build Output Size Constraints', () => {
  it('should ensure index.html size is within limits', (t) => {
    const indexPath = path.resolve(process.cwd(), 'dist', 'index.html')

    if (!fs.existsSync(indexPath)) {
      t.skip('Build artifact dist/index.html not found. Skipping size check.')
      return
    }

    const stats = fs.statSync(indexPath)
    const maxSizeBytes = 10 * 1024 * 1024 // 10 MB
    assert.ok(stats.size <= maxSizeBytes, `index.html size (${stats.size} bytes) exceeds limit (${maxSizeBytes} bytes)`)
  })
})
