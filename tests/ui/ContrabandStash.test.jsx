import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContrabandStash } from '../../src/ui/ContrabandStash.tsx'

vi.mock('../../src/ui/shared/GeneratedImagePanel.tsx', () => ({
  GeneratedImagePanel: ({ alt }) => <img alt={alt} />
}))

vi.mock('../../src/ui/GlitchButton', () => ({
  GlitchButton: ({ children, onClick }) => (
    <button type='button' onClick={onClick}>
      {children}
    </button>
  )
}))

describe('ContrabandStash', () => {
  const baseProps = {
    selectedMember: 'member-1',
    setSelectedMember: vi.fn(),
    handleUseItem: vi.fn(),
    onClose: vi.fn()
  }

  it('renders valid stash items when description is missing', () => {
    render(
      <ContrabandStash
        {...baseProps}
        members={[{ id: 'member-1', name: 'Matze' }]}
        stash={[{ id: 'void-relic', name: 'items:void.name' }]}
      />
    )

    expect(screen.getByText('Unknown Item')).toBeInTheDocument()
    expect(screen.getByText('Unknown Description')).toBeInTheDocument()
  })

  it('ignores inherited member and stash fields', () => {
    const inheritedMember = Object.create({ id: 'ghost', name: 'Ghost' })
    const inheritedItem = Object.create({
      id: 'ghost-item',
      name: 'items:ghost.name',
      description: 'items:ghost.description'
    })

    render(
      <ContrabandStash
        {...baseProps}
        members={[inheritedMember]}
        stash={[inheritedItem]}
      />
    )

    expect(screen.queryByText('Ghost')).not.toBeInTheDocument()
    expect(screen.queryByText('items:ghost.name')).not.toBeInTheDocument()
  })

  it('uses aria-disabled and tooltip when targeted consumable lacks selected member', () => {
    const handleUseItem = vi.fn()
    render(
      <ContrabandStash
        {...baseProps}
        selectedMember={null}
        handleUseItem={handleUseItem}
        members={[{ id: 'member-1', name: 'Matze' }]}
        stash={[
          {
            id: 'c_weekender_coffee',
            type: 'consumable',
            effectType: 'stamina'
          }
        ]}
      />
    )

    const button = screen.getByRole('button', {
      name: /USE ITEM: Unknown Item/i
    })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).not.toBeDisabled()

    button.click()
    expect(handleUseItem).not.toHaveBeenCalled()
  })
})
