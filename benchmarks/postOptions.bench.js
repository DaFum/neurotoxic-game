import { describe, it } from 'node:test'
import { POST_OPTIONS } from '../src/data/postOptions.js'

describe('postOptions performance', () => {
  it('benchmark resolve for all options using traits', async () => {
    // Create a large band with many members and traits
    const band = {
      members: Array.from({ length: 100 }, (_, i) => ({
        name: `Member ${i}`,
        traits: Array.from({ length: 50 }, (_, j) => ({ id: `trait_${j}` }))
      }))
    }
    // Put relevant traits at the very end
    band.members[99].traits.push({ id: 'lead_singer' })
    band.members[99].traits.push({ id: 'gear_nerd' })
    band.members[99].traits.push({ id: 'party_animal' })
    band.members[99].traits.push({ id: 'virtuoso' })

    const optionsToTest = POST_OPTIONS.filter(
      opt => opt.resolve && opt.resolve.toString().includes('traits')
    )

    const start = performance.now()
    for (let i = 0; i < 10000; i++) {
      optionsToTest.forEach(opt => opt.resolve({ band, diceRoll: 0.5 }))
    }
    const end = performance.now()
    console.log(
      `Baseline (10k iterations on 100 members * 50 traits): ${(end - start).toFixed(2)}ms`
    )
  })

  it('benchmark conditions for all options using traits', async () => {
    // Create a large band with many members and traits
    const band = {
      members: Array.from({ length: 100 }, (_, i) => ({
        name: `Member ${i}`,
        traits: Array.from({ length: 50 }, (_, j) => ({ id: `trait_${j}` }))
      }))
    }
    // Put relevant traits at the very end
    band.members[99].traits.push({ id: 'lead_singer' })
    band.members[99].traits.push({ id: 'gear_nerd' })
    band.members[99].traits.push({ id: 'party_animal' })
    band.members[99].traits.push({ id: 'virtuoso' })

    const optionsToTest = POST_OPTIONS.filter(
      opt => opt.condition && opt.condition.toString().includes('traits')
    )

    const start = performance.now()
    for (let i = 0; i < 10000; i++) {
      optionsToTest.forEach(opt =>
        opt.condition({
          band,
          lastGigStats: { score: 20000 },
          social: {},
          player: {}
        })
      )
    }
    const end = performance.now()
    console.log(
      `Baseline conditions (10k iterations on 100 members * 50 traits): ${(end - start).toFixed(2)}ms`
    )
  })
})
