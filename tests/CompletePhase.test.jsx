import { afterEach, describe, expect, test, vi } from 'vitest'
import { render, cleanup, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

afterEach(cleanup)

describe('CompletePhase', () => {
  const mockResult = {
    success: true,
    message: 'Your post went viral!',
    totalFollowers: 1000,
    platform: 'Instagram',
    moneyChange: 500,
    harmonyChange: 10,
    controversyChange: 5,
    loyaltyChange: 15
  }

  const mockPlayer = {
    hqUpgrades: ['pr_manager_contract']
  }

  const mockSocial = {
    controversyLevel: 60
  }

  test('renders success state with viral hit message', async () => {
    const { CompletePhase } =
      await import('../src/components/postGig/CompletePhase.jsx')
    const mockContinue = vi.fn()

    render(
      <CompletePhase
        result={mockResult}
        onContinue={mockContinue}
        player={mockPlayer}
        social={mockSocial}
      />
    )

    expect(screen.getByText('VIRAL HIT!')).toBeTruthy()
    expect(screen.getByText('Your post went viral!')).toBeTruthy()
  })

  test('renders failure state with flop message', async () => {
    const { CompletePhase } =
      await import('../src/components/postGig/CompletePhase.jsx')
    const mockContinue = vi.fn()

    const failResult = { ...mockResult, success: false, totalFollowers: -50 }

    render(
      <CompletePhase
        result={failResult}
        onContinue={mockContinue}
        player={mockPlayer}
        social={mockSocial}
      />
    )

    expect(screen.getByText('FLOPOCOLYPSE')).toBeTruthy()
  })

  test('displays follower count with platform', async () => {
    const { CompletePhase } =
      await import('../src/components/postGig/CompletePhase.jsx')
    const mockContinue = vi.fn()

    render(
      <CompletePhase
        result={mockResult}
        onContinue={mockContinue}
        player={mockPlayer}
        social={mockSocial}
      />
    )

    expect(screen.getByText('+1000 Followers')).toBeTruthy()
    expect(screen.getByText('Instagram')).toBeTruthy()
  })

  test('displays negative follower count without plus sign', async () => {
    const { CompletePhase } =
      await import('../src/components/postGig/CompletePhase.jsx')
    const mockContinue = vi.fn()

    const negativeResult = { ...mockResult, totalFollowers: -100 }

    render(
      <CompletePhase
        result={negativeResult}
        onContinue={mockContinue}
        player={mockPlayer}
        social={mockSocial}
      />
    )

    expect(screen.getByText('-100 Followers')).toBeTruthy()
  })

  test('shows money change when present', async () => {
    const { CompletePhase } =
      await import('../src/components/postGig/CompletePhase.jsx')
    const mockContinue = vi.fn()

    const { container } = render(
      <CompletePhase
        result={mockResult}
        onContinue={mockContinue}
        player={mockPlayer}
        social={mockSocial}
      />
    )

    expect(container.textContent).toContain('+500€')
  })

  test('shows harmony change when present', async () => {
    const { CompletePhase } =
      await import('../src/components/postGig/CompletePhase.jsx')
    const mockContinue = vi.fn()

    const { container } = render(
      <CompletePhase
        result={mockResult}
        onContinue={mockContinue}
        player={mockPlayer}
        social={mockSocial}
      />
    )

    expect(container.textContent).toContain('Harmony')
    expect(container.textContent).toContain('+10')
  })

  test('shows controversy change when present', async () => {
    const { CompletePhase } =
      await import('../src/components/postGig/CompletePhase.jsx')
    const mockContinue = vi.fn()

    const { container } = render(
      <CompletePhase
        result={mockResult}
        onContinue={mockContinue}
        player={mockPlayer}
        social={mockSocial}
      />
    )

    expect(container.textContent).toContain('Controversy')
    expect(container.textContent).toContain('+5')
  })

  test('calls onContinue when continue button is clicked', async () => {
    const { CompletePhase } =
      await import('../src/components/postGig/CompletePhase.jsx')
    const mockContinue = vi.fn()
    const user = userEvent.setup()

    render(
      <CompletePhase
        result={mockResult}
        onContinue={mockContinue}
        player={mockPlayer}
        social={mockSocial}
      />
    )

    const continueButton = screen.getByRole('button', {
      name: /back to tour/i
    })
    await user.click(continueButton)

    expect(mockContinue).toHaveBeenCalledOnce()
  })

  test('shows spin story button when player has PR manager and high controversy', async () => {
    const { CompletePhase } =
      await import('../src/components/postGig/CompletePhase.jsx')
    const mockContinue = vi.fn()
    const mockSpinStory = vi.fn()

    render(
      <CompletePhase
        result={mockResult}
        onContinue={mockContinue}
        onSpinStory={mockSpinStory}
        player={mockPlayer}
        social={mockSocial}
      />
    )

    const spinButton = screen.queryByRole('button', {
      name: /spin story/i
    })
    expect(spinButton).toBeTruthy()
  })

  test('hides spin story button when player lacks PR manager', async () => {
    const { CompletePhase } =
      await import('../src/components/postGig/CompletePhase.jsx')
    const mockContinue = vi.fn()
    const mockSpinStory = vi.fn()

    const noPRPlayer = { hqUpgrades: [] }

    render(
      <CompletePhase
        result={mockResult}
        onContinue={mockContinue}
        onSpinStory={mockSpinStory}
        player={noPRPlayer}
        social={mockSocial}
      />
    )

    const spinButton = screen.queryByRole('button', {
      name: /spin story/i
    })
    expect(spinButton).toBeFalsy()
  })

  test('hides spin story button when controversy is low', async () => {
    const { CompletePhase } =
      await import('../src/components/postGig/CompletePhase.jsx')
    const mockContinue = vi.fn()
    const mockSpinStory = vi.fn()

    const lowControversy = { controversyLevel: 30 }

    render(
      <CompletePhase
        result={mockResult}
        onContinue={mockContinue}
        onSpinStory={mockSpinStory}
        player={mockPlayer}
        social={lowControversy}
      />
    )

    const spinButton = screen.queryByRole('button', {
      name: /spin story/i
    })
    expect(spinButton).toBeFalsy()
  })

  test('calls onSpinStory when spin story button is clicked', async () => {
    const { CompletePhase } =
      await import('../src/components/postGig/CompletePhase.jsx')
    const mockContinue = vi.fn()
    const mockSpinStory = vi.fn()
    const user = userEvent.setup()

    render(
      <CompletePhase
        result={mockResult}
        onContinue={mockContinue}
        onSpinStory={mockSpinStory}
        player={mockPlayer}
        social={mockSocial}
      />
    )

    const spinButton = screen.getByRole('button', {
      name: /spin story/i
    })
    await user.click(spinButton)

    expect(mockSpinStory).toHaveBeenCalledOnce()
  })

  test('handles missing optional props gracefully', async () => {
    const { CompletePhase } =
      await import('../src/components/postGig/CompletePhase.jsx')
    const mockContinue = vi.fn()

    const minimalResult = {
      success: true,
      message: 'Test',
      totalFollowers: 0,
      platform: 'Test'
    }

    render(<CompletePhase result={minimalResult} onContinue={mockContinue} />)

    expect(screen.getByText('VIRAL HIT!')).toBeTruthy()
  })

  test('applies correct color styling for positive money change', async () => {
    const { CompletePhase } =
      await import('../src/components/postGig/CompletePhase.jsx')
    const mockContinue = vi.fn()

    const { container } = render(
      <CompletePhase
        result={mockResult}
        onContinue={mockContinue}
        player={mockPlayer}
        social={mockSocial}
      />
    )

    // Find the specific div containing the money change
    const moneyElement = Array.from(container.querySelectorAll('div')).find(
      el =>
        el.textContent.includes('💰') &&
        el.className.includes('text-(--toxic-green)')
    )
    expect(moneyElement).toBeTruthy()
  })

  test('applies correct color styling for negative money change', async () => {
    const { CompletePhase } =
      await import('../src/components/postGig/CompletePhase.jsx')
    const mockContinue = vi.fn()

    const negativeMoneyResult = { ...mockResult, moneyChange: -200 }

    const { container } = render(
      <CompletePhase
        result={negativeMoneyResult}
        onContinue={mockContinue}
        player={mockPlayer}
        social={mockSocial}
      />
    )

    // Find the specific div containing the money change
    const moneyElement = Array.from(container.querySelectorAll('div')).find(
      el =>
        el.textContent.includes('💰') &&
        el.className.includes('text-(--blood-red)')
    )
    expect(moneyElement).toBeTruthy()
  })
})
