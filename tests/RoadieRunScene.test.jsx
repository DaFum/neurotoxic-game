
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
mock.module('../src/components/stage/RoadieStageController', {
  namedExports: {
    createRoadieStageController: () => ({})
  }
})

mock.module('../src/context/GameState', {
  namedExports: {
    useGameState: () => ({
      band: { harmony: 80 },
      uiState: { itemsRemaining: 5, itemsDelivered: 0, currentDamage: 0, isGameOver: false },
      changeScene: () => {}
    })
  }
})

mock.module('../src/hooks/minigames/useRoadieLogic', {
  namedExports: {
    useRoadieLogic: () => ({
      uiState: { itemsRemaining: 5, itemsDelivered: 0, currentDamage: 0, isGameOver: false },
      gameStateRef: { current: {} },
      stats: {},
      update: () => {},
      actions: { move: () => {} }
    })
  }
})

// Dynamic import of component under test
const { RoadieRunScene } = await import('../src/scenes/RoadieRunScene.jsx')

describe('RoadieRunScene', () => {
  beforeEach(() => {
    setupJSDOM()
  })

  afterEach(() => {
    teardownJSDOM()
    mock.reset()
  })

  test('renders band member images', () => {
    render(<RoadieRunScene />)

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
    const { getByTestId } = render(<RoadieRunScene />)
    assert.ok(getByTestId('pixi-stage'))
  })
})
