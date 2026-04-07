import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('tone', () => {
  return {
    getContext: () => ({
      rawContext: {
        currentTime: 0
      }
    }),
    getTransport: () => ({
      stop: vi.fn(),
      position: 0,
      cancel: vi.fn(),
      state: 'stopped'
    }),
    getDestination: () => ({
      mute: false
    }),
    Context: class {
      resume() {
        return Promise.resolve()
      }
      state = 'running'
    },
    setContext: vi.fn(),
    start: vi.fn().mockResolvedValue(),
    context: {
      state: 'running',
      resume: vi.fn().mockResolvedValue()
    },
    Draw: {
      schedule: vi.fn(),
      cancel: vi.fn()
    },
    Limiter: class {
      connect() {
        return this
      }
      chain() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
      start() {
        return this
      }
    },
    Synth: class {
      constructor() {
        this.volume = { value: 0 }
      }
      connect() {
        return this
      }
      chain() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
      start() {
        return this
      }
    },
    StereoWidener: class {
      connect() {
        return this
      }
      chain() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    Volume: class {
      constructor() {
        this.volume = { value: 0 }
      }
      connect() {
        return this
      }
      chain() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    NoiseSynth: class {
      constructor() {
        this.volume = { value: 0 }
      }
      connect() {
        return this
      }
      chain() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    Compressor: class {
      connect() {
        return this
      }
      chain() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
      start() {
        return this
      }
    },
    Reverb: class {
      connect() {
        return this
      }
      chain() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
      start() {
        return this
      }
    },
    Delay: class {
      chain() {
        return this
      }
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
      start() {
        return this
      }
    },
    EQ3: class {
      chain() {
        return this
      }
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
      start() {
        return this
      }
    },
    Channel: class {
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    Sequence: class {
      start() {}
      stop() {}
      dispose() {}
    },
    Player: class {
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
      start() {}
      stop() {}
    },
    Gain: class {
      constructor() {
        this.gain = { rampTo: vi.fn(), value: 1 }
      }
      chain() {
        return this
      }
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    PolySynth: class {
      constructor() {
        this.volume = { value: 0 }
      }
      connect() {
        return this
      }
      chain() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
      start() {
        return this
      }
    },
    FMSynth: class {
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    Sampler: class {
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    Distortion: class {
      chain() {
        return this
      }
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    Chorus: class {
      chain() {
        return this
      }
      constructor() {
        this.volume = { value: 0 }
      }
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
      start() {
        return this
      }
    },
    Filter: class {
      chain() {
        return this
      }
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    AutoWah: class {
      chain() {
        return this
      }
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    Tremolo: class {
      chain() {
        return this
      }
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    Phaser: class {
      chain() {
        return this
      }
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    BitCrusher: class {
      chain() {
        return this
      }
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    PingPongDelay: class {
      chain() {
        return this
      }
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    Vibrato: class {
      chain() {
        return this
      }
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    FeedbackDelay: class {
      chain() {
        return this
      }
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    MembraneSynth: class {
      constructor() {
        this.volume = { value: 0 }
      }
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    MetalSynth: class {
      constructor() {
        this.volume = { value: 0 }
      }
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    PluckSynth: class {
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    AMSynth: class {
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    MonoSynth: class {
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    Oscillator: class {
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    LFO: class {
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    Envelope: class {
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    AmplitudeEnvelope: class {
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    Meter: class {
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    Analyser: class {
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    Waveform: class {
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    FFT: class {
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    PitchShift: class {
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    JCReverb: class {
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    AutoPanner: class {
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    Chebyshev: class {
      chain() {
        return this
      }
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    Panner: class {
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    CrossFade: class {
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    Merge: class {
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    Split: class {
      connect() {
        return this
      }
      toDestination() {
        return this
      }
      dispose() {}
    },
    Transport: {
      start: vi.fn(),
      stop: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      position: 0,
      state: 'stopped',
      nextSubdivision: vi.fn()
    },
    TransportTime: vi.fn(),
    Time: vi.fn(),
    Loop: class {
      start() {
        return this
      }
      stop() {
        return this
      }
      cancel() {
        return this
      }
      dispose() {}
    }
  }
})

vi.mock('../src/components/PixiStage', () => ({
  PixiStage: () => <div data-testid='pixi-stage-mock'>Pixi Stage</div>
}))

vi.mock('../src/utils/imageGen.js', () => ({
  getGenImageUrl: () => 'mock-url',
  IMG_PROMPTS: {}
}))

vi.mock('../src/context/GameState.jsx', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...actual,
    useGameState: () => ({
      currentGig: { name: 'Test Gig', diff: 1, songId: 'test_song' },
      band: { harmony: 50 },
      player: {},
      settings: { volume: 50 },
      addToast: vi.fn(),
      changeScene: vi.fn(),
      setLastGigStats: vi.fn(),
      endGig: vi.fn(),
      activeEvent: null,
      setActiveEvent: vi.fn()
    })
  }
})

import { Gig } from '../src/scenes/Gig.jsx'
import { GameStateProvider } from '../src/context/GameState.jsx'

describe('Gig Component Integration', () => {
  it('renders standard composition elements of the gig scene', async () => {
    render(
      <GameStateProvider>
        <Gig />
      </GameStateProvider>
    )

    // Wait for the lazy loaded component using findByTestId
    const pixiStage = await screen.findByTestId(
      'pixi-stage-mock',
      {},
      { timeout: 3000 }
    )
    expect(pixiStage).toBeInTheDocument()

    // It should render some band member imagery
    expect(screen.getAllByRole('img').length).toBeGreaterThanOrEqual(3)
  })
})
