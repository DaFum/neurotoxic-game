import React from 'react'
import { bench, describe } from 'vitest'

const isBandMember = value => {
  if (!value || typeof value !== 'object') return false
  const obj = value
  return (
    typeof obj.id === 'string' &&
    (obj.name === undefined || typeof obj.name === 'string')
  )
}

const members = Array.from({ length: 1000 }, (_, i) => ({
  id: `member-${i}`,
  name: `Member ${i}`,
  role: i % 2 === 0 ? 'singer' : 'guitarist',
  // Make some not match isBandMember just to be sure
  ...(i % 10 === 0 ? { id: i } : {})
}))

describe('ContrabandStash member mapping', () => {
  bench('filter and map (current)', () => {
    return members
      .filter(isBandMember)
      .map(m => React.createElement('button', { key: m.id }, m.name))
  })

  bench('reduce (optimized)', () => {
    return members.reduce((acc, m) => {
      if (isBandMember(m)) {
        acc.push(React.createElement('button', { key: m.id }, m.name))
      }
      return acc
    }, [])
  })

  bench('map with null return (idiomatic)', () => {
    return members.map(m => {
      if (!isBandMember(m)) return null
      return React.createElement('button', { key: m.id }, m.name)
    })
  })
})
