import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  CABLES,
  CABLE_MAP,
  SLOT_XS,
  SOCKET_DEFS,
  INITIAL_SOCKET_ORDER,
  TIME_LIMIT
} from '../../src/scenes/kabelsalat/constants'

describe('kabelsalat/constants', () => {
  describe('CABLES', () => {
    it('should be an array of cable definitions', () => {
      assert(Array.isArray(CABLES))
      assert(CABLES.length > 0)
    })

    it('each cable should have required properties', () => {
      for (const cable of CABLES) {
        assert(typeof cable.id === 'string', `Cable missing id`)
        assert(
          typeof cable.labelKey === 'string',
          `Cable ${cable.id} missing labelKey`
        )
        assert(typeof cable.type === 'string', `Cable ${cable.id} missing type`)
        assert(
          typeof cable.x === 'number',
          `Cable ${cable.id} missing x position`
        )
        assert(
          typeof cable.y === 'number',
          `Cable ${cable.id} missing y position`
        )
        assert(
          typeof cable.color === 'string',
          `Cable ${cable.id} missing color`
        )
      }
    })

    it('should have unique cable IDs', () => {
      const ids = new Set()
      for (const cable of CABLES) {
        assert(!ids.has(cable.id), `Duplicate cable ID: ${cable.id}`)
        ids.add(cable.id)
      }
    })

    it('should have at least 3 cables for gameplay variety', () => {
      assert(
        CABLES.length >= 3,
        'Need at least 3 cables for interesting gameplay'
      )
    })
  })

  describe('CABLE_MAP', () => {
    it('should map cable IDs to cable objects', () => {
      assert(typeof CABLE_MAP === 'object')
      assert(CABLE_MAP !== null)
    })

    it('should contain all cables from CABLES array', () => {
      for (const cable of CABLES) {
        assert(CABLE_MAP[cable.id], `CABLE_MAP missing cable: ${cable.id}`)
      }
    })
  })

  describe('SLOT_XS', () => {
    it('should be an array of x positions', () => {
      assert(Array.isArray(SLOT_XS))
      assert(SLOT_XS.length > 0)
    })

    it('should contain only numbers', () => {
      for (const x of SLOT_XS) {
        assert(typeof x === 'number', `Invalid slot x position: ${x}`)
      }
    })

    it('should match the number of cables', () => {
      assert.strictEqual(
        SLOT_XS.length,
        CABLES.length,
        'SLOT_XS length should match CABLES length'
      )
    })
  })

  describe('SOCKET_DEFS', () => {
    it('should be an object of socket definitions', () => {
      assert(typeof SOCKET_DEFS === 'object')
      assert(SOCKET_DEFS !== null)
    })

    it('each socket should have required properties', () => {
      for (const key in SOCKET_DEFS) {
        if (Object.hasOwn(SOCKET_DEFS, key)) {
          const socket = SOCKET_DEFS[key]
          assert(typeof socket.id === 'string')
          assert(typeof socket.labelKey === 'string')
          assert(typeof socket.type === 'string')
          assert(typeof socket.color === 'string')
        }
      }
    })
  })

  describe('INITIAL_SOCKET_ORDER', () => {
    it('should be an array of socket IDs', () => {
      assert(Array.isArray(INITIAL_SOCKET_ORDER))
      assert(INITIAL_SOCKET_ORDER.length > 0)
    })

    it('should contain only valid socket IDs', () => {
      for (const socketId of INITIAL_SOCKET_ORDER) {
        assert(SOCKET_DEFS[socketId])
      }
    })
  })

  describe('TIME_LIMIT', () => {
    it('should be a positive number', () => {
      assert(typeof TIME_LIMIT === 'number')
      assert(TIME_LIMIT > 0)
    })

    it('should be a reasonable game duration', () => {
      assert(TIME_LIMIT >= 10)
      assert(TIME_LIMIT <= 300)
    })
  })
})
