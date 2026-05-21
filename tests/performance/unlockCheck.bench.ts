import { bench, describe } from 'vitest'

const hasRelationshipBelowOld = (
  relationships: unknown,
  threshold: number
): boolean => {
  if (!relationships || typeof relationships !== 'object') return false
  return Object.values(relationships).some(
    score =>
      typeof score === 'number' && Number.isFinite(score) && score < threshold
  )
}

const hasRelationshipBelowNew = (
  relationships: unknown,
  threshold: number
): boolean => {
  if (!relationships || typeof relationships !== 'object') return false
  for (const key in relationships) {
    if (Object.hasOwn(relationships, key)) {
      const score = (relationships as Record<string, unknown>)[key]
      if (
        typeof score === 'number' &&
        Number.isFinite(score) &&
        score < threshold
      ) {
        return true
      }
    }
  }
  return false
}

const generateRelationships = (count: number) => {
  const obj: Record<string, number> = {}
  for (let i = 0; i < count; i++) {
    obj[`member_${i}`] = i + 50
  }
  return obj
}

describe('hasRelationshipBelow', () => {
  const smallObj = generateRelationships(5)
  const largeObj = generateRelationships(100)

  bench('hasRelationshipBelow (Object.values) - small', () => {
    hasRelationshipBelowOld(smallObj, 10)
  })

  bench('hasRelationshipBelow (for...in) - small', () => {
    hasRelationshipBelowNew(smallObj, 10)
  })

  bench('hasRelationshipBelow (Object.values) - large', () => {
    hasRelationshipBelowOld(largeObj, 10)
  })

  bench('hasRelationshipBelow (for...in) - large', () => {
    hasRelationshipBelowNew(largeObj, 10)
  })
})
