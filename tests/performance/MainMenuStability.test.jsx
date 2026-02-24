import { describe, it, beforeEach, afterEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from '../testUtils.js'

// Mock dependencies before import
const changeSceneMock = mock.fn()
const loadGameMock = mock.fn()
const addToastMock = mock.fn()
const resetStateMock = mock.fn()

mock.module('../../src/context/GameState', {
  namedExports: {
    useGameState: () => ({
      changeScene: changeSceneMock,
      loadGame: loadGameMock,
      addToast: addToastMock,
      resetState: resetStateMock
    })
  }
})

const openHQMock = mock.fn()
mock.module('../../src/hooks/useBandHQModal.js', {
  namedExports: {
    useBandHQModal: () => ({
      showHQ: false,
      openHQ: openHQMock,
      bandHQProps: {}
    })
  }
})

const glitchButtonRender = mock.fn(({ children, onClick }) => {
  return <button onClick={onClick}>{children}</button>
})

mock.module('../../src/ui/GlitchButton', {
  namedExports: {
    GlitchButton: glitchButtonRender
  }
})

mock.module('../../src/ui/BandHQ', {
  namedExports: {
    BandHQ: () => <div />
  }
})

mock.module('framer-motion', {
  namedExports: {
    motion: {
      div: ({ children, ...props }) => <div {...props}>{children}</div>,
      h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
      h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>
    }
  }
})

mock.module('../../src/utils/imageGen', {
  namedExports: {
    getGenImageUrl: () => '',
    IMG_PROMPTS: {}
  }
})

mock.module('../../src/utils/AudioManager', {
  namedExports: {
    audioManager: {
      startAmbient: async () => {},
      ensureAudioContext: async () => {}
    }
  }
})

mock.module('../../src/utils/errorHandler', {
  namedExports: {
    handleError: mock.fn()
  }
})

// Dynamic import
const { MainMenu } = await import('../../src/scenes/MainMenu.jsx')

describe('MainMenu Performance Stability', () => {
  beforeEach(setupJSDOM)
  afterEach(() => {
    teardownJSDOM()
    mock.restoreAll()
    glitchButtonRender.mock.resetCalls()
  })

  it('handlers should be stable after optimization', async () => {
    const { rerender } = render(<MainMenu />)

    // First render calls
    const initialCalls = [...glitchButtonRender.mock.calls]
    const creditsCall1 = initialCalls.find(
      c => c.arguments[0].children === 'CREDITS'
    )
    const startTourCall1 = initialCalls.find(
      c => c.arguments[0].children === 'Start Tour'
    )

    assert.ok(creditsCall1, 'CREDITS button rendered')
    assert.ok(startTourCall1, 'Start Tour button rendered')

    // Force re-render
    rerender(<MainMenu />)

    const secondCalls = glitchButtonRender.mock.calls.slice(initialCalls.length)
    const creditsCall2 = secondCalls.find(
      c => c.arguments[0].children === 'CREDITS'
    )
    const startTourCall2 = secondCalls.find(
      c => c.arguments[0].children === 'Start Tour'
    )

    // Assert stability (this should pass after optimization)
    assert.equal(
      creditsCall1.arguments[0].onClick,
      creditsCall2.arguments[0].onClick,
      'CREDITS handler should be stable'
    )
    assert.equal(
      startTourCall1.arguments[0].onClick,
      startTourCall2.arguments[0].onClick,
      'Start Tour handler should be stable'
    )
  })
})
