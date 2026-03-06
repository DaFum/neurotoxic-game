import test from 'node:test'
import assert from 'node:assert/strict'
import { handleLoadGame } from '../src/context/reducers/systemReducer.js'
import { createInitialState } from '../src/context/initialState.js'

test('systemReducer - handleLoadGame legacy venue migration', async t => {
  await t.test('migrates venues:id.name legacy strings to raw IDs', () => {
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
      'berlin',
      'Player location should be migrated to raw ID'
    )
    assert.deepEqual(
      migratedState.venueBlacklist,
      ['leipzig_werk2', 'stendal_adler'],
      'Venue blacklist items should be migrated to raw IDs'
    )
  })
})
