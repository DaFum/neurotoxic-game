
import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { render } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'

// Mock dependencies
mock.module('../src/components/PixiStage', {
  namedExports: {
    PixiStage: () => <div data-testid="pixi-stage">Pixi Stage</div>
  }
})

// Mock the controller to avoid loading Pixi logic and imports
mock.module('../src/components/stage/TourbusStageController', {
  namedExports: {
    createTourbusStageController: () => ({})
  }
})

mock.module('../src/context/GameState', {
  namedExports: {
    useGameState: () => ({
      band: { harmony: 50 },
      uiState: { distance: 100, damage: 0, isGameOver: false },
    })
  }
})

mock.module('../src/hooks/minigames/useTourbusLogic', {
  namedExports: {
    useTourbusLogic: () => ({
      uiState: { distance: 100, damage: 0, isGameOver: false },
      gameStateRef: { current: {} },
      stats: {},
      update: () => {},
      actions: { moveLeft: () => {}, moveRight: () => {} }
    })
  }
})

mock.module('../src/hooks/useArrivalLogic', {
  namedExports: {
    useArrivalLogic: () => ({
      handleArrivalSequence: () => {}
    })
  }
})

// Dynamic import of component under test
const { TourbusScene } = await import('../src/scenes/TourbusScene.jsx')

describe('TourbusScene', () => {
  beforeEach(() => {
    setupJSDOM()
  })

  afterEach(() => {
    teardownJSDOM()
    mock.reset()
  })

  test('renders band member images', () => {
    render(<TourbusScene />)

    // Check for band member containers by ID
    const matzeContainer = document.getElementById('band-member-0')
    const larsContainer = document.getElementById('band-member-1')
    const mariusContainer = document.getElementById('band-member-2')

    assert.ok(matzeContainer, 'Matze container should be present')
    assert.ok(larsContainer, 'Lars container should be present')
    assert.ok(mariusContainer, 'Marius container should be present')

    // Check for images inside
    const matzeImg = matzeContainer.querySelector('img')
    const larsImg = larsContainer.querySelector('img')
    const mariusImg = mariusContainer.querySelector('img')

    assert.ok(matzeImg, 'Matze image should be present')
    assert.strictEqual(matzeImg.alt, 'Matze')

    assert.ok(larsImg, 'Lars image should be present')
    assert.strictEqual(larsImg.alt, 'Lars')

    assert.ok(mariusImg, 'Marius image should be present')
    assert.strictEqual(mariusImg.alt, 'Marius')
  })

  test('renders PixiStage', () => {
    const { getByTestId } = render(<TourbusScene />)
    assert.ok(getByTestId('pixi-stage'))
  })
})
