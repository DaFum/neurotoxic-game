import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SideEffectsSummary } from '../../src/components/postGig/SideEffectsSummary.tsx'

test('SideEffectsSummary shows zero deltas for stamina and mood when provided', () => {
  render(
    <SideEffectsSummary
      result={{ staminaChange: 0, moodChange: 0 }}
      t={(key, options) => options?.defaultValue ?? key}
    />
  )

  expect(screen.getByText(/Band Affected/)).toBeInTheDocument()
  expect(screen.getByText(/0\s+Stamina/)).toBeInTheDocument()
  expect(screen.getByText(/0\s+Mood/)).toBeInTheDocument()
})
