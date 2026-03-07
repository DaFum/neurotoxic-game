import { test, suite } from 'node:test'
import { getGigModifiers, calculateGigPhysics } from '../src/utils/simulationUtils.js'
import { CHARACTERS } from '../src/data/characters.js'

suite('SimulationUtils Performance Benchmark', () => {
  test('calculateGigPhysics performance with standard band', () => {
    const bandState = {
      members: [
        { name: CHARACTERS.MATZE.name, baseStats: { skill: 50 }, stamina: 80, traits: ['virtuoso'] },
        { name: CHARACTERS.MARIUS.name, baseStats: { skill: 60 }, stamina: 70, traits: ['party_animal'] },
        { name: CHARACTERS.LARS.name, baseStats: { skill: 40 }, stamina: 90, traits: ['bandleader'] }
      ],
      harmony: 80
    }
    const song = {
      bpm: 140,
      difficulty: 3
    }

    const iterations = 1000000;

    console.time(`calculateGigPhysics ${iterations} ops`);
    for (let i = 0; i < iterations; i++) {
      calculateGigPhysics(bandState, song)
    }
    console.timeEnd(`calculateGigPhysics ${iterations} ops`);
  })

  test('getGigModifiers performance with standard band', () => {
    const bandState = {
      members: [
        { name: CHARACTERS.MATZE.name, mood: 50 },
        { name: CHARACTERS.MARIUS.name, stamina: 70 },
        { name: CHARACTERS.LARS.name, mood: 40 }
      ],
      harmony: 80
    }

    const iterations = 1000000;

    console.time(`getGigModifiers ${iterations} ops`);
    for (let i = 0; i < iterations; i++) {
      getGigModifiers(bandState)
    }
    console.timeEnd(`getGigModifiers ${iterations} ops`);
  })
})
