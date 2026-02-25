import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test case
afterEach(() => {
  cleanup()
})

// Global mocks often needed for UI components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

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
    dispatchEvent: vi.fn(),
  })),
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

// Mock AudioContext
const AudioContextMock = vi.fn().mockImplementation(() => ({
  state: 'suspended',
  createGain: vi.fn().mockImplementation(() => ({ connect: vi.fn(), gain: { value: 1 } })),
  createOscillator: vi.fn().mockImplementation(() => ({ connect: vi.fn(), start: vi.fn(), stop: vi.fn() })),
  destination: {}
}))

vi.stubGlobal('AudioContext', AudioContextMock)
if (typeof window !== 'undefined') {
  window.AudioContext = AudioContextMock
}

HTMLCanvasElement.prototype.getContext = vi.fn()
