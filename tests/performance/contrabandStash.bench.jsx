import { describe, bench } from 'vitest'
import { isStashItem } from '../../src/ui/ContrabandStash.jsx' // Need to check exports or duplicate

const isStashItemTest = value => {
  if (!value || typeof value !== 'object') return false
  const obj = value
  return typeof obj.id === 'string' && typeof obj.description === 'string'
}

const generateItems = count => {
  const items = []
  for (let i = 0; i < count; i++) {
    if (i % 2 === 0) {
      items.push({ id: `item-${i}`, description: `desc-${i}` })
    } else {
      items.push({ id: `item-${i}` }) // not valid
    }
  }
  return items
}

const largeStash = generateItems(10000)

describe('ContrabandStash Filtering/Mapping', () => {
  bench('filter and map', () => {
    const result = largeStash.filter(isStashItemTest).map(item => ({
      key: item.id,
      item: item
    }))
    return result
  })

  bench('reduce', () => {
    const result = largeStash.reduce((acc, item) => {
      if (isStashItemTest(item)) {
        acc.push({
          key: item.id,
          item: item
        })
      }
      return acc
    }, [])
    return result
  })
})
