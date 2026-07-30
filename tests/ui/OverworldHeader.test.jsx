import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OverworldHeader } from '../../src/ui/overworld/OverworldHeader'

const t = (key, options) => options?.defaultValue ?? key

describe('OverworldHeader', () => {
  it('exposes the tour plan title as a semantic heading', () => {
    render(<OverworldHeader t={t} locationName='Berlin' isTraveling={false} />)

    expect(
      screen.getByRole('heading', { name: 'TOUR PLAN: Berlin' })
    ).toBeInTheDocument()
  })
})
