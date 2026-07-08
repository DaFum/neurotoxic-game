import assert from 'node:assert/strict'
import { test, describe } from 'node:test'
import { maybeFireGigProgressEvent } from '../../src/utils/rhythmGameLoopUtils'

const makeRef = overrides => ({
  progress: 0,
  lastEndedSongIndex: -1,
  ...overrides
})

const makeTrigger = calls => (category, triggerPoint) => {
  calls.push([category, triggerPoint])
  return true
}

describe('maybeFireGigProgressEvent', () => {
  test('fires gig_intro once the gig is underway', () => {
    const calls = []
    const ref = makeRef({ progress: 1 })

    maybeFireGigProgressEvent(ref, makeTrigger(calls))

    assert.deepStrictEqual(calls, [['gig', 'gig_intro']])
    assert.strictEqual(ref.gigIntroFired, true)
  })

  test('limits events to one per song: gig_mid waits for the next song', () => {
    const calls = []
    const trigger = makeTrigger(calls)
    const ref = makeRef({ progress: 1 })

    // Song 0: intro fires, then even at 50%+ no second event this song.
    maybeFireGigProgressEvent(ref, trigger)
    ref.progress = 75
    maybeFireGigProgressEvent(ref, trigger)
    assert.deepStrictEqual(calls, [['gig', 'gig_intro']])

    // Song 1: progress resets, mid fires at the halfway mark.
    ref.lastEndedSongIndex = 0
    ref.progress = 10
    maybeFireGigProgressEvent(ref, trigger)
    assert.deepStrictEqual(calls, [['gig', 'gig_intro']])
    ref.progress = 50
    maybeFireGigProgressEvent(ref, trigger)
    assert.deepStrictEqual(calls, [
      ['gig', 'gig_intro'],
      ['gig', 'gig_mid']
    ])
  })

  test('fires each event at most once per gig', () => {
    const calls = []
    const trigger = makeTrigger(calls)
    const ref = makeRef({
      progress: 90,
      lastEndedSongIndex: 1,
      gigIntroFired: true,
      gigMidFired: true,
      lastGigEventSongIndex: 1
    })

    maybeFireGigProgressEvent(ref, trigger)
    ref.lastEndedSongIndex = 2
    maybeFireGigProgressEvent(ref, trigger)

    assert.deepStrictEqual(calls, [])
  })

  test('a missed chance roll does not consume the song slot', () => {
    const calls = []
    const failThenSucceed = (category, triggerPoint) => {
      calls.push([category, triggerPoint])
      return calls.length > 1
    }
    const ref = makeRef({ progress: 1 })

    // Intro roll misses: the attempt is spent, but not the song's event slot.
    maybeFireGigProgressEvent(ref, failThenSucceed)
    assert.strictEqual(ref.gigIntroFired, true)
    assert.strictEqual(ref.lastGigEventSongIndex, undefined)

    // Mid may still attempt (and succeed) within the same song.
    ref.progress = 60
    maybeFireGigProgressEvent(ref, failThenSucceed)
    assert.deepStrictEqual(calls, [
      ['gig', 'gig_intro'],
      ['gig', 'gig_mid']
    ])
    assert.strictEqual(ref.lastGigEventSongIndex, 0)
  })

  test('does not fire during song transitions (stale previous-song progress)', () => {
    const calls = []
    const ref = makeRef({
      progress: 97,
      lastEndedSongIndex: 0,
      gigIntroFired: true,
      songTransitioning: true
    })

    maybeFireGigProgressEvent(ref, makeTrigger(calls))

    assert.deepStrictEqual(calls, [])
  })

  test('single-song setlist: gig_mid does not fire after the gig is finalized', () => {
    const calls = []
    const trigger = makeTrigger(calls)
    const ref = makeRef({ progress: 1 })

    // Song 0: intro fires, mid blocked (same song).
    maybeFireGigProgressEvent(ref, trigger)
    ref.progress = 75
    maybeFireGigProgressEvent(ref, trigger)
    assert.deepStrictEqual(calls, [['gig', 'gig_intro']])

    // Song 0 ends and the gig finalizes — gig_mid must not fire.
    ref.lastEndedSongIndex = 0
    ref.hasSubmittedResults = true
    maybeFireGigProgressEvent(ref, trigger)
    assert.deepStrictEqual(calls, [['gig', 'gig_intro']])
  })
})
