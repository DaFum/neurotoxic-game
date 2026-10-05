import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ExpeditionIntelPanel } from '../../src/ui/expedition/ExpeditionIntelPanel'
import { createInitialState } from '../../src/context/initialState'
import { createDefaultExpeditionState } from '../../src/domain/expedition/defaults'
import { buildExpeditionMap } from '../../src/domain/expedition/map'
import type { GameState } from '../../src/types'
import type { ExpeditionIntelGrant } from '../../src/types/expedition'

const state: { current: GameState } = vi.hoisted(
  () => ({ current: null }) as never
)
const actions = vi.hoisted(() => ({
  revealExpeditionNodeIntel: vi.fn(),
  createSocialIntelGrant: vi.fn()
}))

vi.mock('../../src/context/GameState', () => ({
  useGameSelector: (selector: (s: GameState) => unknown) =>
    selector(state.current),
  useGameActions: () => actions
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ i18n: { language: 'en' }, t: (key: string) => key })
}))

const RUN_SEED = 4242
const map = buildExpeditionMap(RUN_SEED, 'standard_tour', 'industrial_belt')
const startNodeId = map.startNodeId
const onward = map.connections
  .filter(edge => edge.from === startNodeId)
  .map(edge => edge.to)
const [firstOnward] = onward

const buildState = ({
  crewIds = [] as string[],
  intelGrants = [] as ExpeditionIntelGrant[],
  intelByNodeId = {} as Record<string, 0 | 1 | 2>,
  lastSocialResult = null as GameState['expedition']['lastSocialResult']
} = {}): GameState => {
  const base = createInitialState()
  base.runSeed = RUN_SEED
  base.player = { ...base.player, currentNodeId: startNodeId }
  base.expedition = {
    ...createDefaultExpeditionState(),
    status: 'active',
    runId: 'run_1',
    routeStep: 0,
    visitedNodeIds: [startNodeId],
    intelGrants,
    intelByNodeId,
    lastSocialResult,
    loadout: {
      tourTypeId: 'standard_tour',
      regionId: 'industrial_belt',
      activeTourbusAssetId: null,
      crewIds,
      cargo: { spareParts: 0, supplies: 0 },
      starterPerkId: null,
      nativeContracts: [],
      insurancePolicyId: null,
      pressureModifierIds: [],
      build: {
        setlistSongIds: [],
        equipment: { selectedGearItemIds: [] },
        selectedTourbusModuleIds: [],
        merch: [],
        contraband: [],
        sponsorOfferId: null,
        startingFuelTarget: 100,
        protectedCareerCash: 0
      }
    }
  }
  return base
}

describe('ExpeditionIntelPanel', () => {
  beforeEach(() => {
    for (const fn of Object.values(actions)) fn.mockClear()
  })

  it('stays hidden when the run holds no Scout, grant or tip', () => {
    state.current = buildState()
    const { container } = render(<ExpeditionIntelPanel />)
    expect(container.firstChild).toBeNull()
    expect(actions.revealExpeditionNodeIntel).not.toHaveBeenCalled()
  })

  it('spends the passive Scout read on every unread onward node', () => {
    state.current = buildState({ crewIds: ['noah'] })
    render(<ExpeditionIntelPanel />)
    expect(onward.length).toBeGreaterThan(0)
    for (const nodeId of onward) {
      expect(actions.revealExpeditionNodeIntel).toHaveBeenCalledWith({
        nodeId,
        source: 'scout_passive'
      })
    }
  })

  it('dispatches a Scout recon for the chosen node', () => {
    state.current = buildState({ crewIds: ['noah'] })
    render(<ExpeditionIntelPanel />)
    fireEvent.click(screen.getByTestId(`expedition-intel-recon-${firstOnward}`))
    expect(actions.revealExpeditionNodeIntel).toHaveBeenLastCalledWith({
      nodeId: firstOnward,
      source: 'scout_recon'
    })
  })

  it('consumes a Contact grant by its id', () => {
    const grant: ExpeditionIntelGrant = {
      id: 'expedition_crew_breakthrough:follow_lead:contact:x',
      source: 'contact',
      sourceProofId: 'expedition_crew_breakthrough:follow_lead',
      nodeId: firstOnward as string,
      targetLevel: 1,
      consumed: false
    }
    state.current = buildState({ intelGrants: [grant] })
    render(<ExpeditionIntelPanel />)
    fireEvent.click(
      screen.getByTestId(`expedition-intel-grant-contact-${firstOnward}`)
    )
    expect(actions.revealExpeditionNodeIntel).toHaveBeenCalledWith({
      nodeId: firstOnward,
      source: 'contact_grant',
      grantId: grant.id
    })
  })

  it('hides a consumed grant', () => {
    state.current = buildState({
      intelGrants: [
        {
          id: 'g',
          source: 'contact',
          sourceProofId: 'p',
          nodeId: firstOnward as string,
          targetLevel: 1,
          consumed: true
        }
      ]
    })
    const { container } = render(<ExpeditionIntelPanel />)
    expect(container.firstChild).toBeNull()
  })

  it('turns a settled Social result into a grant for the chosen node', () => {
    state.current = buildState({
      lastSocialResult: {
        id: 'social_proof',
        postOptionId: 'post_hype',
        resultId: 'push',
        resolvedAtRouteStep: 0,
        intelConsumed: false
      }
    })
    render(<ExpeditionIntelPanel />)
    fireEvent.click(
      screen.getByTestId(`expedition-intel-social-tip-${firstOnward}`)
    )
    expect(actions.createSocialIntelGrant).toHaveBeenCalledWith(
      'post_hype',
      'push',
      firstOnward
    )
  })

  it('offers no level-1 tip on nodes a Scout has already read', () => {
    const read = Object.fromEntries(onward.map(nodeId => [nodeId, 1 as const]))
    state.current = buildState({
      crewIds: ['noah'],
      intelByNodeId: read,
      lastSocialResult: {
        id: 'social_proof',
        postOptionId: 'post_hype',
        resultId: 'push',
        resolvedAtRouteStep: 0,
        intelConsumed: false
      }
    })
    render(<ExpeditionIntelPanel />)
    for (const nodeId of onward) {
      expect(
        screen.queryByTestId(`expedition-intel-social-tip-${nodeId}`)
      ).toBeNull()
    }
  })

  it('offers a level-2 tip only where the node already reads level 1', () => {
    const tip = {
      id: 'social_proof',
      postOptionId: 'post_calm',
      resultId: 'suppress' as const,
      resolvedAtRouteStep: 0,
      intelConsumed: false
    }
    state.current = buildState({ lastSocialResult: tip })
    const { container, unmount } = render(<ExpeditionIntelPanel />)
    // Every onward node is unread, so a level-2 grant would be unusable.
    expect(container.firstChild).toBeNull()
    unmount()

    state.current = buildState({
      lastSocialResult: tip,
      intelByNodeId: { [firstOnward as string]: 1 }
    })
    render(<ExpeditionIntelPanel />)
    fireEvent.click(
      screen.getByTestId(`expedition-intel-social-tip-${firstOnward}`)
    )
    expect(actions.createSocialIntelGrant).toHaveBeenCalledWith(
      'post_calm',
      'suppress',
      firstOnward
    )
    for (const nodeId of onward.filter(id => id !== firstOnward)) {
      expect(
        screen.queryByTestId(`expedition-intel-social-tip-${nodeId}`)
      ).toBeNull()
    }
  })

  it('offers no tip for a Social result that carries no intel', () => {
    state.current = buildState({
      lastSocialResult: {
        id: 'social_proof',
        postOptionId: 'post_merch',
        resultId: 'monetize',
        resolvedAtRouteStep: 0,
        intelConsumed: false
      }
    })
    const { container } = render(<ExpeditionIntelPanel />)
    expect(container.firstChild).toBeNull()
  })
})
