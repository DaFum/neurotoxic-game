import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Build Output Size Constraints', () => {
  it('should ensure index.html size is within limits', t => {
    const indexPath = path.resolve(process.cwd(), 'dist', 'index.html')
    if (!fs.existsSync(indexPath)) {
      t.skip(
        'dist/index.html not found. Run `npm run build` before `npm test` to enforce bundle size constraints.'
      )
      return
    }
    const stats = fs.statSync(indexPath)
    const maxSizeBytes = 10 * 1024 * 1024 // 10 MB
    assert.ok(
      stats.size <= maxSizeBytes,
      `Size ${stats.size} exceeds limit ${maxSizeBytes}`
    )
  })
})
