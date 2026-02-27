import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

// Cleanup after each test case
afterEach(() => {
  cleanup()
})

// Global mocks often needed for UI components
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback
  }
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Mock localStorage
const localStorageMock = (function () {
  let store = {}
  return {
    getItem: function (key) {
      return store[key] || null
    },
    setItem: function (key, value) {
      store[key] = value.toString()
    },
    clear: function () {
      store = {}
    },
    removeItem: function (key) {
      delete store[key]
    }
  }
})()

vi.stubGlobal('localStorage', localStorageMock)

beforeEach(() => {
  localStorage.clear()
})

// Mock AudioContext to satisfy standardized-audio-context
const AudioContextMock = vi.fn(() => ({
  state: 'suspended',
  sampleRate: 44100,
  destination: { channelCount: 2, maxChannelCount: 2 },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  createGain: vi.fn().mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
    gain: {
      value: 1,
      linearRampToValueAtTime: vi.fn(),
      setTargetAtTime: vi.fn()
    }
  }),
  createOscillator: vi.fn().mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { value: 440, setValueAtTime: vi.fn() }
  }),
  createDynamicsCompressor: vi.fn().mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
    threshold: { value: -24 },
    knee: { value: 30 },
    ratio: { value: 12 },
    attack: { value: 0.003 },
    release: { value: 0.25 }
  }),
  createBufferSource: vi.fn().mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    buffer: null,
    loop: false
  }),
  decodeAudioData: vi.fn().mockResolvedValue({}),
  resume: vi.fn().mockResolvedValue(),
  suspend: vi.fn().mockResolvedValue(),
  close: vi.fn().mockResolvedValue()
}))

vi.stubGlobal('AudioContext', AudioContextMock)
vi.stubGlobal('webkitAudioContext', AudioContextMock)

if (typeof window !== 'undefined') {
  window.AudioContext = AudioContextMock
  window.webkitAudioContext = AudioContextMock
}

// Mock Tone.js to avoid complex AudioContext checks during tests
vi.mock('tone', async () => {
  return {
    Destination: {
      chain: vi.fn(),
      volume: { value: 0, rampTo: vi.fn() },
      mute: false
    },
    Transport: {
      start: vi.fn(),
      stop: vi.fn(),
      cancel: vi.fn(),
      schedule: vi.fn(),
      bpm: { value: 120 }
    },
    context: {
      resume: vi.fn().mockResolvedValue(),
      state: 'suspended',
      lookAhead: 0
    },
    start: vi.fn().mockResolvedValue(),
    now: vi.fn().mockReturnValue(0),
    loaded: vi.fn().mockResolvedValue(true),
    // Add other used Tone components as needed
    Gain: vi.fn().mockImplementation(() => ({
      connect: vi.fn(),
      disconnect: vi.fn(),
      toDestination: vi.fn(),
      gain: { value: 1, rampTo: vi.fn() }
    })),
    Oscillator: vi.fn().mockImplementation(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      connect: vi.fn(),
      toDestination: vi.fn(),
      frequency: { value: 440, rampTo: vi.fn() },
      dispose: vi.fn()
    })),
    Player: vi.fn().mockImplementation(() => ({
      toDestination: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      dispose: vi.fn(),
      buffer: { duration: 10 }
    })),
    // Mock the synth and other instruments used
    MembraneSynth: vi.fn().mockImplementation(() => ({
      toDestination: vi.fn(),
      triggerAttackRelease: vi.fn(),
      connect: vi.fn(),
      dispose: vi.fn()
    })),
    MetalSynth: vi.fn().mockImplementation(() => ({
      toDestination: vi.fn(),
      triggerAttackRelease: vi.fn(),
      connect: vi.fn(),
      dispose: vi.fn()
    })),
    NoiseSynth: vi.fn().mockImplementation(() => ({
      toDestination: vi.fn(),
      triggerAttackRelease: vi.fn(),
      connect: vi.fn(),
      dispose: vi.fn()
    })),
    Distortion: vi.fn().mockImplementation(() => ({
      toDestination: vi.fn(),
      connect: vi.fn(),
      dispose: vi.fn()
    })),
    Reverb: vi.fn().mockImplementation(() => ({
      toDestination: vi.fn(),
      connect: vi.fn(),
      generate: vi.fn().mockResolvedValue(),
      dispose: vi.fn()
    })),
    FeedbackDelay: vi.fn().mockImplementation(() => ({
      toDestination: vi.fn(),
      connect: vi.fn(),
      dispose: vi.fn()
    })),
    Volume: vi.fn().mockImplementation(() => ({
      connect: vi.fn(),
      volume: { value: 0, rampTo: vi.fn() },
      dispose: vi.fn()
    }))
  }
})

HTMLCanvasElement.prototype.getContext = vi.fn(contextId => {
  if (contextId === '2d') {
    return {
      imageSmoothingEnabled: true,
      drawImage: vi.fn(),
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      fillText: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn()
    }
  }
  if (contextId === 'webgl' || contextId === 'webgl2') {
    return {
      getExtension: vi.fn(),
      getParameter: vi.fn(),
      createTexture: vi.fn(),
      bindTexture: vi.fn(),
      texParameteri: vi.fn(),
      texImage2D: vi.fn(),
      clearColor: vi.fn(),
      clear: vi.fn(),
      enable: vi.fn(),
      blendFunc: vi.fn(),
      viewport: vi.fn(),
      createBuffer: vi.fn(),
      bindBuffer: vi.fn(),
      bufferData: vi.fn(),
      createShader: vi.fn(),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      createProgram: vi.fn(),
      attachShader: vi.fn(),
      linkProgram: vi.fn(),
      useProgram: vi.fn(),
      getUniformLocation: vi.fn(),
      getAttribLocation: vi.fn(),
      enableVertexAttribArray: vi.fn(),
      vertexAttribPointer: vi.fn(),
      drawArrays: vi.fn(),
      canvas: { width: 800, height: 600 }
    }
  }
  return null
})
