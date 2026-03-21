import { performance } from 'node:perf_hooks'

const isForbiddenKey = (key) => key === '__proto__' || key === 'constructor' || key === 'prototype'

const applyInventoryItemDelta = (currentValue, deltaValue) => {
  if (deltaValue === true || deltaValue === false) {
    return deltaValue
  }
  if (typeof deltaValue === 'number') {
    const currentCount = typeof currentValue === 'number' ? currentValue : 0
    return Math.max(0, currentCount + deltaValue)
  }
  return currentValue
}

const generateDelta = (size) => {
  const inventory = {}
  for (let i = 0; i < size; i++) {
    inventory[`item_${i}`] = Math.floor(Math.random() * 10)
  }
  return { band: { inventory } }
}

const delta = generateDelta(5)
const nextBand = { inventory: {} }
const state = { band: { inventory: {} } }
const applied = { band: { inventory: {} } }

const testForIn1 = () => {
  if (delta.band.inventory) {
    applied.band.inventory = {}
    for (const itemId in delta.band.inventory) {
      if (!Object.hasOwn(delta.band.inventory, itemId) || isForbiddenKey(itemId)) continue

      const qty = delta.band.inventory[itemId]
      if (typeof qty === 'number') {
        if (qty !== 0) applied.band.inventory[itemId] = qty
      } else if (qty === true) {
        applied.band.inventory[itemId] = true
      } else if (qty === false) {
        const current = typeof state.band?.inventory?.[itemId] === 'number' ? state.band.inventory[itemId] : 0
        if (current > 0) applied.band.inventory[itemId] = -1
        else applied.band.inventory[itemId] = false
      }
    }
  }
}

const testObjectKeys1 = () => {
  if (delta.band.inventory) {
    applied.band.inventory = {}
    const keys = Object.keys(delta.band.inventory)
    for (let i = 0; i < keys.length; i++) {
      const itemId = keys[i]
      if (isForbiddenKey(itemId)) continue

      const qty = delta.band.inventory[itemId]
      if (typeof qty === 'number') {
        if (qty !== 0) applied.band.inventory[itemId] = qty
      } else if (qty === true) {
        applied.band.inventory[itemId] = true
      } else if (qty === false) {
        const current = typeof state.band?.inventory?.[itemId] === 'number' ? state.band.inventory[itemId] : 0
        if (current > 0) applied.band.inventory[itemId] = -1
        else applied.band.inventory[itemId] = false
      }
    }
  }
}

const testForIn2 = () => {
  if (delta.band.inventory) {
    nextBand.inventory = { ...nextBand.inventory }
    for (const item in delta.band.inventory) {
      if (!Object.hasOwn(delta.band.inventory, item) || isForbiddenKey(item)) continue
      const val = delta.band.inventory[item]
      nextBand.inventory[item] = applyInventoryItemDelta(nextBand.inventory[item], val)
    }
  }
}

const testObjectKeys2 = () => {
  if (delta.band.inventory) {
    nextBand.inventory = { ...nextBand.inventory }
    const keys = Object.keys(delta.band.inventory)
    for (let i = 0; i < keys.length; i++) {
      const item = keys[i]
      if (isForbiddenKey(item)) continue
      const val = delta.band.inventory[item]
      nextBand.inventory[item] = applyInventoryItemDelta(nextBand.inventory[item], val)
    }
  }
}

// Warm up
for (let i = 0; i < 10000; i++) {
  testForIn1()
  testObjectKeys1()
  testForIn2()
  testObjectKeys2()
}

const ITERATIONS = 1000000

const start1 = performance.now()
for (let i = 0; i < ITERATIONS; i++) testForIn1()
const end1 = performance.now()
console.log('ForIn1:', end1 - start1)

const start2 = performance.now()
for (let i = 0; i < ITERATIONS; i++) testObjectKeys1()
const end2 = performance.now()
console.log('ObjectKeys1:', end2 - start2)

const start3 = performance.now()
for (let i = 0; i < ITERATIONS; i++) testForIn2()
const end3 = performance.now()
console.log('ForIn2:', end3 - start3)

const start4 = performance.now()
for (let i = 0; i < ITERATIONS; i++) testObjectKeys2()
const end4 = performance.now()
console.log('ObjectKeys2:', end4 - start4)
