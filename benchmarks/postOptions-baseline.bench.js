import { describe, it } from 'node:test'
import { POST_OPTIONS } from '../src/data/postOptions.js'

describe('postOptions performance (baseline)', () => {
  it('benchmark conditions and resolve for all options using traits', async () => {
    // Create a realistically sized band, but run many iterations to simulate long game session
    const band = {
      members: Array.from({ length: 5 }, (_, i) => ({
        name: `Member ${i}`,
        traits: Array.from({ length: 4 }, (_, j) => ({ id: `trait_${j}` }))
      }))
    }
    band.members[0].traits.push({ id: 'lead_singer' })
    band.members[1].traits.push({ id: 'gear_nerd' })
    band.members[2].traits.push({ id: 'party_animal' })
    band.members[3].traits.push({ id: 'virtuoso' })

    const conditionOpts = POST_OPTIONS.filter(
      opt => opt.condition && opt.condition.toString().includes('traits')
    )
    const resolveOpts = POST_OPTIONS.filter(
      opt => opt.resolve && opt.resolve.toString().includes('traits')
    )

    const start = performance.now()
    for (let i = 0; i < 1000000; i++) {
      conditionOpts.forEach(opt =>
        opt.condition({
          band,
          lastGigStats: { score: 20000 },
          social: {},
          player: {}
        })
      )
      resolveOpts.forEach(opt =>
        opt.resolve({
          band,
          diceRoll: 0.5,
          social: {},
          player: {},
          lastGigStats: {}
        })
      )
    }
    const end = performance.now()
    console.log(
      `Baseline (50k iterations, 5 members * 4 traits): ${(end - start).toFixed(2)}ms`
    )
  })
})
