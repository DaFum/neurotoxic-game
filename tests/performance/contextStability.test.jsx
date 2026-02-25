import { expect, test, vi } from 'vitest'


import { act, render } from '@testing-library/react'
import { useEffect } from 'react'

test('GameState context functions stability', async _t => {
  // Dynamic import to ensure globals are set
  const { GameStateProvider, useGameState } =
    await import('../../src/context/GameState.jsx')

  let renderCount = 0
  let changeSceneRef = null

  const Consumer = () => {
    const { changeScene, updatePlayer, player } = useGameState()
    renderCount++

    // Store references to check stability
    useEffect(() => {
      changeSceneRef = changeScene
    })

    return (
      <div>
        <button
          onClick={() => updatePlayer({ money: (player.money || 0) + 10 })}
        >
          Update
        </button>
        <span data-testid='money'>{player.money}</span>
      </div>
    )
  }

  const { getByText } = render(
    <GameStateProvider>
      <Consumer />
    </GameStateProvider>
  )

  // Wait for initial effects to settle (map generation)
  await act(async () => {
    await new Promise(r => setTimeout(r, 0))
  })

  const initialRenderCount = renderCount
  const initialChangeScene = changeSceneRef

  // Trigger update
  await act(async () => {
    getByText('Update').click()
  })

  // Should have re-rendered
  expect(renderCount).toBeGreaterThan(initialRenderCount)

  if (changeSceneRef === initialChangeScene) {
    console.log('Success: changeScene is STABLE!')
  } else {
    console.log('Failure: changeScene changed reference')
  }

  // Verification: Stable
  expect(changeSceneRef).toBe(initialChangeScene)
})
