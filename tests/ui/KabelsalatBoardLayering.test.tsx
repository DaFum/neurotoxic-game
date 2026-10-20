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
  const block = chip.parentElement
  expect(block).not.toBeNull()
  expect(block?.className).toContain('flex-col')
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

  it('keeps the void surge block in flow as a row strip from sm up', () => {
    renderBoard(25)

    const { className } = getSurgeBlock()
    expect(className).not.toMatch(/(^|\s)(sm:)?absolute(\s|$)/)
    expect(className).not.toContain('sm:top-5')
    expect(className).toContain('mb-2')
    expect(className).toContain('sm:flex-row')
  })

  it('binds the board wrapper width to the viewport height from sm up', () => {
    const { container } = renderBoard(25)

    const board = (container.querySelector('svg') as Element).closest(
      '[class*="aspect-[4/3]"]'
    )
    expect(board).not.toBeNull()
    const wrapper = (board as Element).parentElement
    expect(wrapper).not.toBeNull()
    expect(wrapper?.className).toContain('relative w-full')
    const className = wrapper?.className ?? ''
    // The height cap only applies on tall-enough viewports: a landscape phone
    // (e.g. 844x390) is wide enough for `sm` but would shrink the board to ~221px
    // and push the touch targets back under 44px.
    expect(className).toContain(
      '[@media(min-height:30rem)]:max-w-[min(100%,calc((100svh-14rem)*4/3))]'
    )
    expect(className).not.toContain(' sm:max-w-[min(')
    expect(className).toContain('sm:mx-auto')
  })

  it('drops the purge button top margin in the strip row', () => {
    renderBoard(25)

    expect(
      screen.getByRole('button', {
        name: 'ui:minigames.kabelsalat.purgeAnomaly'
      }).className
    ).toContain('sm:mt-0')
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

  it('gives the PURGE ANOMALY button a 44px touch height on phone only', () => {
    renderBoard(25)

    const { className } = screen.getByRole('button', {
      name: 'ui:minigames.kabelsalat.purgeAnomaly'
    })
    expect(className).toContain('max-sm:min-h-11')
    // Touch devices keep the 44px target even when `sm` applies (landscape).
    expect(className).toContain('[@media(pointer:coarse)]:min-h-11')
    expect(className).toContain('max-sm:px-4')
    expect(className).toContain('px-3 py-1')
  })

  it('gives the PURGE ANOMALY button a visible keyboard focus ring', () => {
    renderBoard(25)

    const { className } = screen.getByRole('button', {
      name: 'ui:minigames.kabelsalat.purgeAnomaly'
    })
    expect(className).toContain('focus-visible:ring-2')
    expect(className).toContain('focus-visible:ring-toxic-green')
  })
})
