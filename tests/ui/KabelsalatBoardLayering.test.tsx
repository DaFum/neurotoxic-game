import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { KabelsalatBoard } from '../../src/scenes/kabelsalat/components/KabelsalatBoard'
import type { TFunction } from 'i18next'

const mockT = ((key: string) => key) as unknown as TFunction

const renderBoard = (voidSurge = 0, purgeVoidSurge: () => void = () => {}) =>
  render(
    <KabelsalatBoard
      t={mockT}
      isShocked={false}
      isPoweredOn={false}
      isGameOver={false}
      faultReason={null}
      isPowerConnected={false}
      lightningSeeds={[]}
      connections={{}}
      socketOrder={[]}
      selectedCable={null}
      handleSocketClick={() => {}}
      handleCableClick={() => {}}
      onAdvance={() => {}}
      voidSurge={voidSurge}
      purgeVoidSurge={purgeVoidSurge}
    />
  )

const getSurgeBlock = (): Element => {
  const chip = screen.getByText(/ui:minigames\.kabelsalat\.voidSurge/)
  const block = chip.closest('[class*="sm:absolute"]')
  expect(block).not.toBeNull()
  return block as Element
}

describe('KabelsalatBoard Layering', () => {
  it('does not use z-(--z-crt) for the board SVG', () => {
    const { container } = renderBoard()

    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg).not.toHaveClass('z-(--z-crt)')
    expect(svg).toHaveClass('z-(--z-stage-bg)')
  })

  it('renders the void surge block before the board, outside it', () => {
    const { container } = renderBoard(25)

    const block = getSurgeBlock()
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(block.contains(svg)).toBe(false)
    expect(
      block.compareDocumentPosition(svg as Node) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('keeps the void surge block in flow on phone and absolute from sm up', () => {
    renderBoard(25)

    const { className } = getSurgeBlock()
    expect(className).not.toMatch(/(^|\s)absolute(\s|$)/)
    expect(className).toContain('mb-2')
    expect(className).toContain('sm:top-5')
  })

  it('keeps the purge button reachable with the same callback', () => {
    const purgeVoidSurge = vi.fn()
    renderBoard(25, purgeVoidSurge)

    fireEvent.click(
      screen.getByRole('button', {
        name: 'ui:minigames.kabelsalat.purgeAnomaly'
      })
    )
    expect(purgeVoidSurge).toHaveBeenCalledTimes(1)
  })
})
