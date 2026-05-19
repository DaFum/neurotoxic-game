import { bench, describe } from 'vitest'
import { generateEffectText } from '../../src/utils/effectFormatter'

const t = (key: string, options?: { defaultValue?: string }) =>
  options?.defaultValue ?? key

// Generate a large dummy delta object for the benchmark
const createLargeDelta = () => {
  const inventory: Record<string, number | boolean> = {}
  for (let i = 0; i < 1000; i++) {
    inventory[`item_${i}`] = i % 2 === 0 ? i : true
  }
  return {
    band: {
      inventory
    }
  }
}

const largeDelta = createLargeDelta()

describe('generateEffectText Performance', () => {
  bench('generateEffectText with large inventory', () => {
    generateEffectText(largeDelta, t)
  })
})
