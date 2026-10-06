import { act, render, screen, fireEvent } from '@testing-library/react'
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

// Store listeners, so a test can publish a new state to a mounted panel the
// way the real store subscription does (the panel is memoized and takes no
// props, so a plain rerender would not reach it).
const listeners = vi.hoisted(() => new Set<() => void>())

vi.mock('../../src/context/GameState', async () => {
  const { useEffect, useReducer } = await import('react')
  return {
    useGameSelector: (selector: (s: GameState) => unknown) => {
      const [, forceRender] = useReducer((n: number) => n + 1, 0)
      useEffect(() => {
        listeners.add(forceRender)
        return () => {
          listeners.delete(forceRender)
        }
      }, [])
      return selector(state.current)
    },
    useGameActions: () => actions
  }
})

const publish = (next: GameState): void => {
  state.current = next
  act(() => {
    for (const listener of listeners) listener()
  })
}

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    i18n: { language: 'en' },
    // Echoes `lane` so rows that differ only by map position stay tellable.
    t: (key: string, options?: { lane?: number }) =>
      options?.lane === undefined ? key : `${key}:${options.lane}`
  })
}))

const RUN_SEED = 4242
const map = buildExpeditionMap(RUN_SEED, 'standard_tour', 'industrial_belt')
const startNodeId = map.startNodeId
const onward = map.connections
  .filter(edge => edge.from === startNodeId)
  .map(edge => edge.to)
const [firstOnward] = onward

const buildState = ({
  runId = 'run_1',
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
    runId,
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

  it('reads each onward node once per run, and again in the next run', () => {
    // Node ids are deterministic per seed, so the next run on the same route
    // reuses them; the passive read must not stay remembered across runs.
    state.current = buildState({ crewIds: ['noah'] })
    render(<ExpeditionIntelPanel />)
    expect(actions.revealExpeditionNodeIntel).toHaveBeenCalledTimes(
      onward.length
    )

    // Same run, fresh state object: no second read.
    publish(buildState({ crewIds: ['noah'] }))
    expect(actions.revealExpeditionNodeIntel).toHaveBeenCalledTimes(
      onward.length
    )

    actions.revealExpeditionNodeIntel.mockClear()
    publish(buildState({ runId: 'run_2', crewIds: ['noah'] }))
    for (const nodeId of onward) {
      expect(actions.revealExpeditionNodeIntel).toHaveBeenCalledWith({
        nodeId,
        source: 'scout_passive'
      })
    }
  })

  it('labels each onward node the way the route map does', () => {
    state.current = buildState({ crewIds: ['noah'] })
    render(<ExpeditionIntelPanel />)
    const labels = onward.map(
      nodeId =>
        screen.getByTestId(`expedition-intel-node-label-${nodeId}`).textContent
    )
    // Rows of the same class and intel level would otherwise read the same.
    expect(new Set(labels).size).toBe(onward.length)
    for (const nodeId of onward) {
      const label = screen.getByTestId(`expedition-intel-node-label-${nodeId}`)
      const sameStep = map.nodeOrder.filter(
        id => map.meta[id]?.routeStep === map.meta[nodeId]?.routeStep
      )
      // Left-to-right position among the step's nodes, as the map draws them.
      expect(label).toHaveTextContent(
        `ui:expedition.intel.lane:${sameStep.indexOf(nodeId) + 1}`
      )
      const venueName = map.nodes[nodeId]?.venue?.name
      if (venueName) {
        // The map's own label: the venue name through translateLocation.
        expect(label).toHaveTextContent(
          venueName
            .replace(/^venues:/, '')
            .replace(/\.name$/, '')
            .replace(/_/g, ' ')
        )
      }
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
