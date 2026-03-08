import test from 'node:test'
import assert from 'node:assert/strict'
import { handleLoadGame } from '../src/context/reducers/systemReducer.js'
import { createInitialState } from '../src/context/initialState.js'

test('systemReducer - handleLoadGame legacy venue migration', async t => {
  await t.test(
    'preserves venues:id.name location and normalizes blacklist IDs',
    () => {
      const initialState = createInitialState()

      const legacyLoadedState = {
        ...initialState,
        player: {
          ...initialState.player,
          location: 'venues:berlin.name'
        },
        venueBlacklist: ['venues:leipzig_werk2.name', 'stendal_adler']
      }

      const migratedState = handleLoadGame(initialState, legacyLoadedState)

      assert.equal(
        migratedState.player.location,
        'venues:berlin.name',
        'Player location should remain a full venues key'
      )
      assert.deepEqual(
        migratedState.venueBlacklist,
        ['leipzig_werk2', 'stendal_adler'],
        'Venue blacklist items should be migrated to raw IDs'
      )
    }
  )

  await t.test('migrates raw location IDs to venues keys', () => {
    const initialState = createInitialState()

    const legacyLoadedState = {
      ...initialState,
      player: {
        ...initialState.player,
        location: 'berlin'
      }
    }

    const migratedState = handleLoadGame(initialState, legacyLoadedState)
    assert.equal(
      migratedState.player.location,
      'venues:berlin.name',
      'Raw location IDs should be migrated to full venues keys'
    )
  })

  await t.test(
    'gracefully handles missing player.location during legacy migration',
    () => {
      const initialState = createInitialState()

      const legacyLoadedState = {
        ...initialState,
        player: {
          ...initialState.player,
          location: null
        }
      }

      const migratedState = handleLoadGame(initialState, legacyLoadedState)
      assert.equal(
        migratedState.player.location,
        null,
        'Should not modify a null location'
      )

      const undefinedState = {
        ...initialState,
        player: {
          ...initialState.player,
          location: undefined
        }
      }

      const migratedState2 = handleLoadGame(initialState, undefinedState)
      assert.equal(
        migratedState2.player.location,
        undefined,
        'Location remains undefined since object spreads overwrite properties with undefined values'
      )
    }
  )

  await t.test('migration is idempotent', () => {
    const initialState = createInitialState()

    const legacyLoadedState = {
      ...initialState,
      player: {
        ...initialState.player,
        location: 'venues:berlin.name'
      },
      venueBlacklist: ['venues:leipzig_werk2.name', 'stendal_adler']
    }

    const migratedState = handleLoadGame(initialState, legacyLoadedState)
    const secondMigratedState = handleLoadGame(initialState, migratedState)

    assert.equal(
      secondMigratedState.player.location,
      'venues:berlin.name',
      'Idempotent player.location migration'
    )
    assert.deepEqual(
      secondMigratedState.venueBlacklist,
      ['leipzig_werk2', 'stendal_adler'],
      'Idempotent venueBlacklist migration'
    )
  })

  await t.test('keeps empty venueBlacklist arrays empty', () => {
    const initialState = createInitialState()

    const legacyLoadedState = {
      ...initialState,
      venueBlacklist: []
    }

    const migratedState = handleLoadGame(initialState, legacyLoadedState)

    assert.deepEqual(
      migratedState.venueBlacklist,
      [],
      'Empty venueBlacklist remains empty after mapping'
    )
  })
})
