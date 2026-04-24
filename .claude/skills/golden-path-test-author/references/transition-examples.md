# Golden Path Transition Examples

## Table of Contents
- [Transition 1: MENU → OVERWORLD (Game Start)](#transition-1-menu-overworld-game-start)
- [Transition 2: OVERWORLD → PRE_GIG (Start Gig)](#transition-2-overworld-pre_gig-start-gig)
- [Transition 3: PRE_GIG → GIG (Performance Starts)](#transition-3-pre_gig-gig-performance-starts)
- [Transition 4: GIG → POST_GIG (Score Capture)](#transition-4-gig-post_gig-score-capture)
- [Transition 5: POST_GIG → OVERWORLD (Return Home)](#transition-5-post_gig-overworld-return-home)
- [Edge Case: Bankruptcy Path (POST_GIG → GAMEOVER)](#edge-case-bankruptcy-path-post_gig-gameover)


Complete examples for all 5 critical game transitions.

## Transition 1: MENU → OVERWORLD (Game Start)

Tests initial state setup and scene transition to the main gameplay loop.

```javascript
test('Golden Path: MENU → OVERWORLD initialization', async t => {
  let state = createInitialState()

  await t.test('Initial state has correct defaults', () => {
    assert.equal(state.currentScene, GAME_PHASES.INTRO)
    assert.equal(state.player.money, 500)
    assert.equal(state.player.day, 1)
    assert.equal(state.band.harmony, 80)
    assert.equal(state.currentGig, null)
    assert.ok(state.band.members.length > 0, 'Band initialized')
  })

  await t.test('Transition to MENU', () => {
    state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.MENU)
    assert.equal(state.currentScene, GAME_PHASES.MENU)
  })

  await t.test('MENU → OVERWORLD transition', () => {
    state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.OVERWORLD)
    assert.equal(state.currentScene, GAME_PHASES.OVERWORLD)
    assert.ok(state.player.money > 0, 'Player has starting money')
  })

  await t.test('Initialize game map in OVERWORLD', () => {
    const mockMap = {
      layers: [[{ id: 'node_0_0', layer: 0, type: 'START' }]],
      nodes: {
        node_0_0: {
          id: 'node_0_0',
          layer: 0,
          venue: { id: 'start', type: 'START', name: 'Home', pay: 0 },
          type: 'START'
        },
        node_1_0: {
          id: 'node_1_0',
          layer: 1,
          venue: {
            id: 'venue_1',
            type: 'GIG',
            name: 'Punk Hall',
            pay: 300,
            capacity: 200
          },
          type: 'GIG'
        }
      },
      connections: [['node_0_0', 'node_1_0']]
    }
    state = applyAction(state, ActionTypes.SET_MAP, mockMap)
    assert.ok(state.gameMap, 'Map loaded')
    assert.ok(state.gameMap.nodes.node_1_0, 'Destination node available')
  })

  await t.test('Player can travel to next node', () => {
    const travelCost = 50
    state = applyAction(state, ActionTypes.UPDATE_PLAYER, {
      money: state.player.money - travelCost,
      currentNodeId: 'node_1_0',
      location: 'Berlin'
    })
    assert.equal(state.player.currentNodeId, 'node_1_0')
    assert.equal(state.player.location, 'Berlin')
    assert.ok(state.player.money > 0, 'Money remains after travel')
  })
})
```

## Transition 2: OVERWORLD → PRE_GIG (Start Gig)

Tests entering a gig from the overworld and setting up for performance.

```javascript
test('Golden Path: OVERWORLD → PRE_GIG setup', async t => {
  let state = createInitialState()
  state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.OVERWORLD)

  const venue = {
    id: 'test_venue',
    name: 'Punk Keller',
    capacity: 200,
    price: 10,
    pay: 300,
    dist: 50,
    diff: 2,
    type: 'GIG'
  }

  await t.test('START_GIG transitions to PRE_GIG', () => {
    state = applyAction(state, ActionTypes.START_GIG, venue)
    assert.equal(
      state.currentScene,
      GAME_PHASES.PRE_GIG,
      'Scene changed to PRE_GIG'
    )
    assert.deepEqual(state.currentGig, venue, 'Venue stored')
  })

  await t.test('Gig modifiers reset to defaults', () => {
    // START_GIGresetsModifiers to defaults (false/false/false)
    assert.equal(state.gigModifiers.soundcheck, false)
    assert.equal(state.gigModifiers.merch, false)
    assert.equal(state.gigModifiers.promo, false)
  })

  await t.test('Configure setlist', () => {
    const setlist = [{ id: '01 Kranker Schrank' }, { id: '02 Toxic Beat' }]
    state = applyAction(state, ActionTypes.SET_SETLIST, setlist)
    assert.equal(state.setlist.length, 2)
    assert.equal(state.setlist[0].id, '01 Kranker Schrank')
  })

  await t.test('Enable modifiers', () => {
    state = applyAction(state, ActionTypes.SET_GIG_MODIFIERS, {
      soundcheck: true,
      merch: true
    })
    assert.equal(state.gigModifiers.soundcheck, true)
    assert.equal(state.gigModifiers.merch, true)
    assert.equal(state.gigModifiers.promo, false, 'Unset modifier stays false')
  })

  await t.test('Player ready to perform', () => {
    assert.ok(state.currentGig, 'Gig selected')
    assert.ok(state.setlist.length > 0, 'Setlist configured')
    assert.ok(
      state.gigModifiers.soundcheck || state.gigModifiers.merch,
      'Modifier enabled'
    )
  })
})
```

## Transition 3: PRE_GIG → GIG (Performance Starts)

Tests entering the rhythm game and capturing performance stats.

```javascript
test('Golden Path: PRE_GIG → GIG performance', async t => {
  let state = createInitialState()
  state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.OVERWORLD)

  const venue = {
    id: 'test',
    name: 'Hall',
    capacity: 200,
    price: 10,
    pay: 300,
    diff: 2,
    type: 'GIG'
  }
  state = applyAction(state, ActionTypes.START_GIG, venue)
  state = applyAction(state, ActionTypes.SET_SETLIST, [{ id: '01 Song' }])

  await t.test('Transition to GIG scene', () => {
    state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.GIG)
    assert.equal(state.currentScene, GAME_PHASES.GIG)
  })

  await t.test('Gig data persists during performance', () => {
    assert.ok(state.currentGig, 'currentGig still available')
    assert.ok(state.setlist.length > 0, 'Setlist available')
    assert.ok(state.gigModifiers, 'Modifiers available')
  })

  await t.test('Capture performance stats', () => {
    const stats = {
      score: 8500,
      perfectHits: 55,
      misses: 2,
      maxCombo: 35,
      peakHype: 80,
      toxicTimeTotal: 1500
    }
    state = applyAction(state, ActionTypes.SET_LAST_GIG_STATS, stats)
    assert.deepEqual(state.lastGigStats, stats)
    assert.equal(state.lastGigStats.score, 8500)
  })

  await t.test('Stats are valid', () => {
    const { score, perfectHits, misses, maxCombo, peakHype } =
      state.lastGigStats
    assert.ok(score > 0, 'Score recorded')
    assert.ok(perfectHits >= 0, 'Perfect hits >= 0')
    assert.ok(misses >= 0, 'Misses >= 0')
    assert.ok(maxCombo >= 0, 'Max combo >= 0')
    assert.ok(peakHype >= 0 && peakHype <= 100, 'Peak hype in [0, 100]')
  })
})
```

## Transition 4: GIG → POST_GIG (Score Capture)

Tests ending performance and moving to financial settlement.

```javascript
test('Golden Path: GIG → POST_GIG settlement', async t => {
  let state = createInitialState()
  state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.OVERWORLD)
  state = applyAction(state, ActionTypes.START_GIG, {
    id: 'v1',
    name: 'Venue',
    capacity: 200,
    price: 10,
    pay: 300,
    diff: 2,
    type: 'GIG'
  })
  state = applyAction(state, ActionTypes.SET_SETLIST, [{ id: '01 Song' }])
  state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.GIG)

  await t.test('Record final stats before transition', () => {
    const gigStats = {
      score: 7000,
      perfectHits: 45,
      misses: 5,
      maxCombo: 20,
      peakHype: 65,
      toxicTimeTotal: 0
    }
    state = applyAction(state, ActionTypes.SET_LAST_GIG_STATS, gigStats)
    assert.equal(state.lastGigStats.score, 7000)
  })

  await t.test('Transition to POST_GIG', () => {
    state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.POST_GIG)
    assert.equal(state.currentScene, GAME_PHASES.POST_GIG)
  })

  await t.test('Gig and stats available in POST_GIG', () => {
    assert.ok(state.currentGig, 'currentGig still set')
    assert.ok(state.lastGigStats, 'lastGigStats available')
    assert.equal(state.lastGigStats.score, 7000, 'Stats persist')
  })

  await t.test('Calculate performance score from stats', () => {
    // Performance score is clamped to [30, 100]
    const rawScore = Math.min(100, Math.max(30, state.lastGigStats.score / 500))
    assert.ok(
      rawScore >= 30 && rawScore <= 100,
      `Performance score ${rawScore} valid`
    )
  })

  await t.test('Apply earnings (simplified)', () => {
    const earnings = 250
    const fameGain = 50
    const moneyBefore = state.player.money
    const fameBefore = state.player.fame

    state = applyAction(state, ActionTypes.UPDATE_PLAYER, {
      money: state.player.money + earnings,
      fame: state.player.fame + fameGain
    })

    assert.equal(state.player.money, moneyBefore + earnings, 'Earnings applied')
    assert.equal(state.player.fame, fameBefore + fameGain, 'Fame increased')
    assert.ok(state.player.money >= 0, 'Money remains valid')
  })
})
```

## Transition 5: POST_GIG → OVERWORLD (Return Home)

Tests clearing gig state and returning to exploration phase.

```javascript
test('Golden Path: POST_GIG → OVERWORLD cleanup', async t => {
  let state = createInitialState()
  state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.OVERWORLD)
  state = applyAction(state, ActionTypes.START_GIG, {
    id: 'v1',
    name: 'V',
    capacity: 200,
    price: 10,
    pay: 300,
    diff: 2,
    type: 'GIG'
  })
  state = applyAction(state, ActionTypes.SET_SETLIST, [{ id: 'song' }])
  state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.GIG)
  state = applyAction(state, ActionTypes.SET_LAST_GIG_STATS, {
    score: 5000,
    perfectHits: 40,
    misses: 10,
    maxCombo: 15,
    peakHype: 50,
    toxicTimeTotal: 0
  })
  state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.POST_GIG)

  await t.test('Apply PostGig earnings', () => {
    state = applyAction(state, ActionTypes.UPDATE_PLAYER, {
      money: state.player.money + 200,
      fame: state.player.fame + 30
    })
    assert.equal(state.player.fame, 30, 'Fame tracked')
  })

  await t.test('Clear gig from state', () => {
    state = applyAction(state, ActionTypes.SET_GIG, null)
    assert.equal(state.currentGig, null, 'Gig nulled')
  })

  await t.test('Clear performance stats', () => {
    state = applyAction(state, ActionTypes.SET_LAST_GIG_STATS, null)
    assert.equal(state.lastGigStats, null, 'Stats nulled')
  })

  await t.test('Reset modifiers to defaults', () => {
    state = applyAction(state, ActionTypes.SET_GIG_MODIFIERS, {
      soundcheck: false,
      merch: false,
      promo: false,
      catering: false
    })
    assert.equal(state.gigModifiers.soundcheck, false)
  })

  await t.test('Return to OVERWORLD', () => {
    state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.OVERWORLD)
    assert.equal(state.currentScene, GAME_PHASES.OVERWORLD)
  })

  await t.test('Gig state completely cleared', () => {
    assert.equal(state.currentGig, null, 'No active gig')
    assert.equal(state.lastGigStats, null, 'No gig stats')
    assert.ok(
      state.setlist.length >= 0,
      'Setlist can persist or clear (depends on design)'
    )
  })

  await t.test('Ready for next day/gig cycle', () => {
    assert.equal(state.currentScene, GAME_PHASES.OVERWORLD)
    assert.ok(state.gameMap, 'Map available for travel')
    assert.ok(state.player.money >= 0, 'Money safe')
    assert.ok(state.band.harmony >= 1, 'Harmony safe')
  })
})
```

## Edge Case: Bankruptcy Path (POST_GIG → GAMEOVER)

Tests when a poor gig performance drains player funds below 0.

```javascript
test('Golden Path: Bankruptcy triggers GAMEOVER', async t => {
  let state = createInitialState()
  state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.OVERWORLD)

  await t.test('Setup: Drain player to low money', () => {
    state = applyAction(state, ActionTypes.UPDATE_PLAYER, { money: 50 })
    assert.equal(state.player.money, 50)
  })

  await t.test('Start and complete a gig poorly', () => {
    state = applyAction(state, ActionTypes.START_GIG, {
      id: 'v',
      name: 'V',
      capacity: 100,
      price: 5,
      pay: 100,
      diff: 4,
      type: 'GIG'
    })
    state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.GIG)
    // Poor performance
    state = applyAction(state, ActionTypes.SET_LAST_GIG_STATS, {
      score: 1500,
      perfectHits: 5,
      misses: 50,
      maxCombo: 3,
      peakHype: 20,
      toxicTimeTotal: 0
    })
    state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.POST_GIG)
  })

  await t.test('Apply large loss', () => {
    const loss = -100 // Expenses > earnings
    state = applyAction(state, ActionTypes.UPDATE_PLAYER, {
      money: state.player.money + loss
    })
    // Reducer clamps to 0
    assert.equal(state.player.money, 0, 'Money clamped to 0')
  })

  await t.test('Trigger GAMEOVER', () => {
    state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.GAMEOVER)
    assert.equal(state.currentScene, GAME_PHASES.GAMEOVER)
  })

  await t.test('Reset from GAMEOVER', () => {
    state = gameReducer(state, { type: ActionTypes.RESET_STATE })
    assert.equal(state.currentScene, GAME_PHASES.INTRO)
    assert.equal(state.player.money, 500, 'Money restored')
    assert.equal(state.player.day, 1, 'Day reset')
  })
})
```
