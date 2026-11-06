import assert from 'node:assert/strict'
import { test, mock } from 'node:test'

const transport = {
  state: 'stopped',
  position: 0,
  bpm: { value: 120 },
  stop: mock.fn(function () {
    this.state = 'stopped'
  }),
  start: mock.fn(function () {
    this.state = 'started'
  }),
  cancel: mock.fn(),
  clear: mock.fn(),
  scheduleOnce: mock.fn(() => 1)
}
const createPart = mock.fn()
class Part {
  constructor() {
    createPart()
  }
  start() {
    return this
  }
  dispose() {}
}
mock.module('tone', {
  namedExports: {
    getTransport: () => transport,
    Part,
    Time: () => ({ toSeconds: () => 0.5 }),
    now: () => 10,
    Frequency: () => ({ toNote: () => 'C4' })
  }
})
mock.module(new URL('../../src/utils/audio/context.ts', import.meta.url).href, {
  namedExports: {
    ensureAudioContext: async () => true,
    getRawAudioContext: () => ({ currentTime: 10 }),
    getAudioContextTimeSec: () => 10,
    withAudioContext: async fn => fn()
  }
})
mock.module(new URL('../../src/utils/audio/assets.ts', import.meta.url).href, {
  namedExports: { midiUrlMap: {}, loadAudioBuffer: async () => null }
})
const { audioState } = await import('../../src/utils/audio/state')
const { playSongFromData } = await import('../../src/utils/audio/midiPlayback')
const { stopAudio } = await import('../../src/utils/audio/transportControl')
const song = { notes: [{ t: 0, p: 60, v: 100 }], bpm: 120 }

test('a stop during song preparation prevents Parts, clock anchoring, and transport restart', async () => {
  audioState.isSetup = true
  audioState.guitar = {}
  audioState.bass = {}
  audioState.drumKit = {}
  const anchor = mock.fn(() => 10)
  const pending = playSongFromData(song, 0, { resolveStartTimeSec: anchor })
  // Transport preparation succeeded, but the nested caller has not resumed.
  await Promise.resolve()
  stopAudio()
  assert.equal(await pending, false)
  assert.equal(createPart.mock.calls.length, 0)
  assert.equal(anchor.mock.calls.length, 0)
  assert.equal(transport.start.mock.calls.length, 0)
  assert.equal(transport.state, 'stopped')
  assert.equal(audioState.part, null)
})

test('a current song request still schedules playback', async () => {
  assert.equal(await playSongFromData(song), true)
  assert.ok(audioState.part)
  assert.equal(transport.state, 'started')
  stopAudio()
})
