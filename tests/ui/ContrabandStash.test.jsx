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
})
