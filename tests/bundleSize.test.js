import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Build Output Size Constraints', () => {
  it('should ensure index.html size is within limits', () => {
    const indexPath = path.resolve(process.cwd(), 'dist', 'index.html')
    expect(fs.existsSync(indexPath)).toBe(true)
    const stats = fs.statSync(indexPath)
    const maxSizeBytes = 10 * 1024 * 1024 // 10 MB
    expect(stats.size).toBeLessThanOrEqual(maxSizeBytes)
  })
})
