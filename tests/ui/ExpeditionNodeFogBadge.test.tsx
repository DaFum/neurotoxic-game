import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ExpeditionNodeFogBadge } from '../../src/ui/expedition/ExpeditionNodeFogBadge'
import { getExpeditionNodeFogByNodeId } from '../../src/domain/expedition/nodeFog'
import {
  buildExpeditionMap,
  getExpeditionNodePublicFacts
} from '../../src/domain/expedition/map'
import { startedState } from '../expeditionLifecycleFixture.js'
import type { GameState } from '../../src/types'

vi.mock('../../src/utils/numberUtils', async importOriginal => ({
  ...(await importOriginal<typeof import('../../src/utils/numberUtils')>()),
  formatCurrency: (value: number) => `${value} EUR`
}))

const t = (key: string, options?: Record<string, unknown>): string => {
  if (options && Object.hasOwn(options, 'defaultValue')) {
    return String(options.defaultValue)
  }
  return options && Object.keys(options).length > 0
    ? `${key}:${Object.values(options).join(',')}`
    : key
}

describe('ExpeditionNodeFogBadge', () => {
  it('renders the public route facts of a real node: depth and onward routes', () => {
    const state = startedState() as GameState
    const loadout = state.expedition.loadout
    if (!loadout) throw new Error('fixture run has no loadout')
    const map = buildExpeditionMap(
      state.runSeed,
      loadout.tourTypeId,
      loadout.regionId
    )
    const fogByNodeId = getExpeditionNodeFogByNodeId(state)
    if (!fogByNodeId) throw new Error('fixture run has no fog projection')

    // A node one step in: it has a depth above zero and at least one exit.
    const nodeId = map.nodeOrder.find(id => map.meta[id]?.routeStep === 1)
    if (!nodeId) throw new Error('fixture route has no step-1 node')
    const facts = getExpeditionNodePublicFacts(map, nodeId)
    const fog = fogByNodeId[nodeId]
    if (!facts || !fog) throw new Error('node has no public facts')
    expect(facts.edges.length).toBeGreaterThan(0)

    render(<ExpeditionNodeFogBadge fog={fog} t={t} />)

    const route = screen.getByTestId('expedition-node-fog-route')
    expect(route.textContent).toContain(
      `ui:expedition.node.routeStep:${facts.routeStep}`
    )
    expect(route.textContent).toContain(
      `ui:expedition.node.onwardRoutes:${facts.edges.length}`
    )
    // The joiner between depth and onward routes is localized copy too.
    expect(route.textContent).toContain('ui:expedition.node.routeFacts')
    expect(route.textContent).not.toContain('·')
  })

  it('rounds the scouted wear instead of printing float noise', () => {
    const state = startedState() as GameState
    const loadout = state.expedition.loadout
    if (!loadout) throw new Error('fixture run has no loadout')
    const map = buildExpeditionMap(
      state.runSeed,
      loadout.tourTypeId,
      loadout.regionId
    )
    const nodeId = map.nodeOrder.find(id => map.meta[id]?.routeStep === 1)
    const fog = nodeId ? getExpeditionNodeFogByNodeId(state)?.[nodeId] : null
    if (!fog) throw new Error('node has no fog projection')

    // Route wear times fractional chassis and crew multipliers.
    render(
      <ExpeditionNodeFogBadge
        fog={{ ...fog, exactPayout: 195, exactWearCost: 12.0703 }}
        t={t}
      />
    )

    expect(document.body.textContent).toContain('ui:expedition.node.wear 12')
    expect(document.body.textContent).not.toContain('12.07')
  })

  it('omits the onward count on the Finale, which has no exits', () => {
    const state = startedState() as GameState
    const loadout = state.expedition.loadout
    if (!loadout) throw new Error('fixture run has no loadout')
    const map = buildExpeditionMap(
      state.runSeed,
      loadout.tourTypeId,
      loadout.regionId
    )
    const fog = getExpeditionNodeFogByNodeId(state)?.[map.finaleNodeId]
    if (!fog) throw new Error('Finale has no fog projection')

    render(<ExpeditionNodeFogBadge fog={fog} t={t} />)

    const route = screen.getByTestId('expedition-node-fog-route')
    expect(route.textContent).toContain('ui:expedition.node.routeStep:')
    expect(route.textContent).not.toContain('ui:expedition.node.onwardRoutes')
  })
})
