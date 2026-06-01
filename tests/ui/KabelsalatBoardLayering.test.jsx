import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { KabelsalatBoard } from '../../src/scenes/kabelsalat/components/KabelsalatBoard'

const mockT = (key) => key

describe('KabelsalatBoard Layering', () => {
  it('does not use z-(--z-crt) for the board SVG', () => {
    const { container } = render(
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
        voidSurge={0}
        purgeVoidSurge={() => {}}
      />
    )

    const svg = container.querySelector('svg')
    expect(svg).not.toHaveClass('z-(--z-crt)')
    expect(svg).toHaveClass('z-(--z-stage-bg)')
  })
})
