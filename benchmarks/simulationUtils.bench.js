import { bench, describe } from 'vitest'
import {
  getGigModifiers,
  calculateGigPhysics
} from '../src/utils/simulationUtils.js'
import { CHARACTERS } from '../src/data/characters.js'

describe('simulationUtils', () => {
  const mockBandState = {
    harmony: 50,
    members: [
      {
        name: CHARACTERS.MATZE.name,
        mood: 10,
        stamina: 100,
        skill: 50,
        traits: ['tech_wizard', 'gear_nerd']
      },
      {
        name: CHARACTERS.MARIUS.name,
        mood: 100,
        stamina: 10,
        skill: 60,
        traits: ['blast_machine', 'party_animal']
      },
      {
        name: CHARACTERS.LARS.name,
        mood: 100,
        stamina: 100,
        skill: 70,
        traits: ['melodic_genius', 'bandleader']
      }
    ]
  }

  const mockSong = {
    bpm: 180,
    difficulty: 4
  }

  bench('getGigModifiers', () => {
    getGigModifiers(mockBandState, {})
  })

  bench('calculateGigPhysics', () => {
    calculateGigPhysics(mockBandState, mockSong)
  })
})
