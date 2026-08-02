import { afterEach, describe, expect, test, vi } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import React from 'react'

// A stable `t` keeps the render budget about the band selectors alone; the real
// `useTranslation` hands out a fresh `t` per render in this environment.
vi.mock('react-i18next', () => {
  const t = (key, options) => options?.defaultValue ?? key
  return {
    useTranslation: () => ({ t, i18n: { language: 'en' } }),
    initReactI18next: { type: '3rdParty', init: () => {} },
    Trans: ({ children }) => children
  }
})

// Counts every render of the panel HUD actually mounts. React.memo mirrors the
// real BandStatusPanel, so a referentially stable `band` prop bails out.
const bandPanelRenders = vi.hoisted(() => ({ count: 0 }))

vi.mock('../../src/ui/hud/shared/SharedHUDComponents', async () => {
  const { default: ReactModule } = await import('react')
  return {
    VanStatusMiniBars: ReactModule.memo(() => (
      <div data-testid='van-status-mini-bars' />
    )),
    BandStatusPanel: ReactModule.memo(() => {
      bandPanelRenders.count++
      return <div data-testid='band-status-panel' />
    })
  }
})

import {
  GameStateProvider,
  useGameSelector,
  useGameActions
} from '../../src/context/GameState.tsx'
import { HUD } from '../../src/ui/HUD.tsx'

// Baseline for the removed wholesale selection: selects `state.band` and hands
// the whole object to an identically memoized panel.
const legacyPanelRenders = { count: 0 }

const LegacyBandStatusPanel = React.memo(() => {
  legacyPanelRenders.count++
  return <div data-testid='legacy-band-status-panel' />
})
LegacyBandStatusPanel.displayName = 'LegacyBandStatusPanel'

const LegacyHUDBandSection = React.memo(() => {
  const band = useGameSelector(state => state.band)
  return <LegacyBandStatusPanel band={band} />
})
LegacyHUDBandSection.displayName = 'LegacyHUDBandSection'

let updateBand = () => {}
let members = []

const StateBridge = () => {
  ;({ updateBand } = useGameActions())
  members = useGameSelector(state => state.band.members)
  return null
}

afterEach(() => {
  cleanup()
  bandPanelRenders.count = 0
  legacyPanelRenders.count = 0
})

describe('HUD band selector optimization', () => {
  test('band mutations that leave harmony/members untouched do not re-render the band panel', async () => {
    render(
      <GameStateProvider>
        <StateBridge />
        <HUD />
        <LegacyHUDBandSection />
      </GameStateProvider>
    )

    // Ignore mount renders; only post-mutation renders are budgeted.
    bandPanelRenders.count = 0
    legacyPanelRenders.count = 0

    await act(async () => {
      updateBand({ inventory: { neuroDecimator: true } })
    })

    // Narrowed selectors: harmony and members are unchanged, so no re-render.
    expect(bandPanelRenders.count).toBe(0)
    // Wholesale `state.band` selection: a new band object on every mutation.
    expect(legacyPanelRenders.count).toBe(1)

    await act(async () => {
      updateBand({ luck: 42 })
    })

    expect(bandPanelRenders.count).toBe(0)
    expect(legacyPanelRenders.count).toBe(2)
  })

  test('harmony and member changes still re-render the band panel', async () => {
    render(
      <GameStateProvider>
        <StateBridge />
        <HUD />
      </GameStateProvider>
    )

    bandPanelRenders.count = 0

    await act(async () => {
      updateBand({ harmony: 42 })
    })

    expect(bandPanelRenders.count).toBe(1)

    const firstMemberId = members[0]?.id
    expect(firstMemberId).toBeTruthy()

    await act(async () => {
      updateBand({ members: [{ id: firstMemberId, stamina: 13 }] })
    })

    expect(bandPanelRenders.count).toBe(2)
  })
})
