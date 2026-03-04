import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Build Output Size Constraints', () => {
  it('should ensure index.html size is within limits', () => {
    const indexPath = path.resolve(process.cwd(), 'dist', 'index.html')
    const exists = fs.existsSync(indexPath)
    if (!exists) {
      // Skip this check when the build output is not present.
      console.warn(
        'Skipping bundle size test: dist/index.html not found. Run `npm run build` before this test to enable size checks.'
      )
      return
    }
    const stats = fs.statSync(indexPath)
    const maxSizeBytes = 10 * 1024 * 1024 // 10 MB
    expect(stats.size).toBeLessThanOrEqual(maxSizeBytes)
  })
})
