import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const mockTone = vi.hoisted(() => {
  const createMockAudioNode = () => {
    return class MockAudioNode {
      constructor() {
        this.volume = { value: 0 }
        this.gain = { rampTo: vi.fn(), value: 1 }
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
      stop() {
        return this
      }
      cancel() {
        return this
      }
    }
  }

  const MockNode = createMockAudioNode()

  return {
    getContext: () => ({ rawContext: { currentTime: 0 } }),
    getTransport: () => ({
      stop: vi.fn(),
      position: 0,
      cancel: vi.fn(),
      state: 'stopped'
    }),
    getDestination: () => ({ mute: false }),
    Context: class {
      resume() {
        return Promise.resolve()
      }
      state = 'running'
    },
    setContext: vi.fn(),
    start: vi.fn().mockResolvedValue(),
    context: { state: 'running', resume: vi.fn().mockResolvedValue() },
    Draw: { schedule: vi.fn(), cancel: vi.fn() },
    Limiter: MockNode,
    Synth: MockNode,
    StereoWidener: MockNode,
    Volume: MockNode,
    NoiseSynth: MockNode,
    Compressor: MockNode,
    Reverb: MockNode,
    Delay: MockNode,
    EQ3: MockNode,
    Channel: MockNode,
    Sequence: MockNode,
    Player: MockNode,
    Gain: MockNode,
    PolySynth: MockNode,
    FMSynth: MockNode,
    Sampler: MockNode,
    Distortion: MockNode,
    Chorus: MockNode,
    Filter: MockNode,
    AutoWah: MockNode,
    Tremolo: MockNode,
    Phaser: MockNode,
    BitCrusher: MockNode,
    PingPongDelay: MockNode,
    Vibrato: MockNode,
    FeedbackDelay: MockNode,
    MembraneSynth: MockNode,
    MetalSynth: MockNode,
    PluckSynth: MockNode,
    AMSynth: MockNode,
    MonoSynth: MockNode,
    Oscillator: MockNode,
    LFO: MockNode,
    Envelope: MockNode,
    AmplitudeEnvelope: MockNode,
    Meter: MockNode,
    Analyser: MockNode,
    Waveform: MockNode,
    FFT: MockNode,
    PitchShift: MockNode,
    JCReverb: MockNode,
    AutoPanner: MockNode,
    Chebyshev: MockNode,
    Panner: MockNode,
    CrossFade: MockNode,
    Merge: MockNode,
    Split: MockNode,
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
    Loop: MockNode
  }
})

vi.mock('tone', () => mockTone)

vi.mock('../../src/components/PixiStage', () => ({
  PixiStage: () => <div data-testid='pixi-stage-mock'>Pixi Stage</div>
}))

vi.mock('../../src/utils/imageGen.js', () => ({
  getGenImageUrl: () => 'mock-url',
  IMG_PROMPTS: {}
}))

vi.mock('../../src/context/GameState.tsx', async importOriginal => {
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

import { Gig } from '../../src/scenes/Gig.tsx'
import { GameStateProvider } from '../../src/context/GameState.tsx'

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
