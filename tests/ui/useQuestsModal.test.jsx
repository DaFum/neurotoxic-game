import { renderHook, act } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { useQuestsModal } from '../../src/hooks/useQuestsModal'

vi.mock('../../src/context/GameState.tsx', () => ({
  useGameState: () => ({
    activeQuests: ['quest1'],
    player: { name: 'Player' }
  })
}))

test('useQuestsModal toggles modal state correctly', () => {
  const { result } = renderHook(() => useQuestsModal())

  expect(result.current.showQuests).toBe(false)

  act(() => {
    result.current.openQuests()
  })
  expect(result.current.showQuests).toBe(true)

  act(() => {
    result.current.closeQuests()
  })
  expect(result.current.showQuests).toBe(false)
})

test('useQuestsModal computes questsProps correctly', () => {
  const { result } = renderHook(() => useQuestsModal())
  expect(result.current.questsProps.activeQuests).toEqual(['quest1'])
  expect(result.current.questsProps.player).toEqual({ name: 'Player' })
})
