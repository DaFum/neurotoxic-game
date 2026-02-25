import { test, describe, afterEach, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import React, { useEffect } from 'react'
import { render, cleanup, fireEvent, act } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import { GameStateProvider, useGameState } from '../src/context/GameState.jsx'
import { Credits } from '../src/scenes/Credits.jsx'

// A small harness to capture global actions if needed, though Credits just fires changeScene
const CreditsTestHarness = () => {
  const { currentScene } = useGameState()
  return (
    <div>
      <div data-testid="scene">{currentScene}</div>
      <Credits />
    </div>
  )
}

describe('Credits Scene', () => {
  beforeEach(() => {
    setupJSDOM()
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
  })

  test('renders credits content', () => {
    const { getByText } = render(
      <GameStateProvider>
        <Credits />
      </GameStateProvider>
    )
    assert.ok(getByText('CREDITS'))
    assert.ok(getByText('VOCAL CODE VOMIT'))
  })

  test('calls changeScene("MENU") when RETURN is clicked', async () => {
    const { getByText, getByTestId } = render(
      <GameStateProvider>
        <CreditsTestHarness />
      </GameStateProvider>
    )
    
    // Initial scene might be OVERWORLD or MENU based on initial state, but let's click RETURN
    const returnBtn = getByText('RETURN')
    fireEvent.click(returnBtn)
    
    // Check if the scene updated to MENU
    assert.equal(getByTestId('scene').textContent, 'MENU')
  })
})
