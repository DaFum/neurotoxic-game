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
            instanceId: 'coffee-1',
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
    expect(button).toHaveAttribute(
      'aria-describedby',
      'target-required-coffee-1'
    )
    expect(button).not.toBeDisabled()

    button.click()
    expect(handleUseItem).not.toHaveBeenCalled()
  })

  it('renders target member button selection group with accessible ARIA attributes', () => {
    render(
      <ContrabandStash
        {...baseProps}
        selectedMember='member-1'
        members={[
          { id: 'member-1', name: 'Matze' },
          { id: 'member-2', name: 'Susi' }
        ]}
        stash={[]}
      />
    )

    const group = screen.getByRole('group', { name: /Target Member:/i })
    expect(group).toBeInTheDocument()

    const selectedBtn = screen.getByRole('button', {
      name: 'Target member: Matze (Selected)'
    })
    expect(selectedBtn).toHaveAttribute('aria-pressed', 'true')

    const unselectedBtn = screen.getByRole('button', {
      name: 'Select target member: Susi'
    })
    expect(unselectedBtn).toHaveAttribute('aria-pressed', 'false')
  })

  it('renders the item icon as a decorative glyph next to the name', () => {
    render(
      <ContrabandStash
        {...baseProps}
        members={[{ id: 'member-1', name: 'Matze' }]}
        stash={[
          { id: 'c_void_energy', instanceId: 'i1', icon: 'icon_void_energy' }
        ]}
      />
    )

    const icon = screen.getByTestId('contraband-icon-c_void_energy')
    expect(icon).toHaveAttribute('aria-hidden', 'true')
    expect(icon.textContent).not.toBe('')
    expect(screen.getByRole('heading', { level: 4 })).not.toHaveTextContent(
      icon.textContent
    )
  })

  it('renders no icon for an item without a known icon id', () => {
    render(
      <ContrabandStash
        {...baseProps}
        members={[]}
        stash={[{ id: 'void-relic', icon: 'icon_nope' }]}
      />
    )
    expect(screen.queryByTestId('contraband-icon-void-relic')).toBeNull()
  })
})
