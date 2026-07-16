import { mock } from 'node:test'

export function createMockLogger() {
  return {
    debug: mock.fn(),
    info: mock.fn(),
    warn: mock.fn(),
    error: mock.fn(),
    logs: []
  }
}

export function createMockEnsureAudioContext(result = true) {
  return mock.fn(async () => result)
}

function createTriggerableInstrument() {
  return { triggerAttackRelease: mock.fn() }
}

function createDrumKit() {
  return {
    kick: createTriggerableInstrument(),
    snare: createTriggerableInstrument(),
    hihat: createTriggerableInstrument(),
    crash: createTriggerableInstrument(),
    ride: createTriggerableInstrument()
  }
}

export function createMockAudioState({
  includeMidi = true,
  includeLoop = false
} = {}) {
  const state = {
    isSetup: true,
    playRequestId: 0,
    guitar: createTriggerableInstrument(),
    bass: createTriggerableInstrument(),
    drumKit: createDrumKit(),
    transportEndEventId: null,
    transportStopEventId: null
  }

  if (includeMidi) {
    state.midiLead = createTriggerableInstrument()
    state.midiBass = createTriggerableInstrument()
    state.midiDrumKit = createDrumKit()
    state.midiParts = []
  }

  if (includeLoop) {
    state.loop = null
  }

  return state
}
