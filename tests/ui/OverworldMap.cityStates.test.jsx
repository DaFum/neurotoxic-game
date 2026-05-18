import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'

// Capture props passed to MapNodeView so we can assert on cityTraits
const capturedProps = []
vi.mock('../../src/components/MapNodeView', () => ({
  MapNodeView: props => {
    capturedProps.push(props)
    return <div data-testid='map-node' />
  }
}))

vi.mock('../../src/components/MapConnection', () => ({
  MapConnection: () => <g />
}))

vi.mock('../../src/components/overworld/TravelingVan', () => ({
  TravelingVan: () => null
}))

vi.mock('../../src/utils/imageGen', () => ({
  isImageGenerationAvailable: () => false,
  resolveGenImageUrl: () => 'mock-url',
  getGeneratedImageFallbackUrl: () => 'mock-fallback',
  getGenImageUrl: () => 'mock-image',
  IMG_PROMPTS: {}
}))

vi.mock('../../src/utils/economyEngine', () => ({
  calculateEffectiveTicketPrice: () => 10
}))

vi.mock('../../src/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => true
}))

const { OverworldMap } =
  await import('../../src/components/overworld/OverworldMap.tsx')

const mockT = key => key

const berlinTraits = {
  genreBias: 'punk',
  attentionSpan: 35,
  barSpendingProfile: 'drunkards'
}

const makeGameMap = (withCityStates = true) => ({
  nodes: {
    node_0_0: {
      id: 'node_0_0',
      type: 'START',
      layer: 0,
      x: 10,
      y: 50,
      venue: null,
      connections: ['node_1_0']
    },
    node_1_0: {
      id: 'node_1_0',
      type: 'GIG',
      layer: 1,
      x: 50,
      y: 50,
      venue: {
        id: 'berlin_so36',
        name: 'SO36',
        capacity: 300,
        pay: 200,
        price: 10,
        diff: 2
      },
      connections: []
    }
  },
  nodeList: [],
  connections: [{ from: 'node_0_0', to: 'node_1_0' }],
  layers: [['node_0_0'], ['node_1_0']],
  cityStates: withCityStates ? { berlin: berlinTraits } : undefined
})

const baseProps = {
  t: mockT,
  player: {
    currentNodeId: 'node_0_0',
    money: 500,
    fame: 10,
    fameLevel: 1,
    day: 1
  },
  rivalBand: null,
  band: { harmony: 80 },
  currentLayer: 0,
  isTraveling: false,
  pendingTravelNode: null,
  getNodeVisibility: () => 'visible',
  isConnected: () => true,
  handleTravel: vi.fn(),
  setHoveredNode: vi.fn(),
  hoveredNode: null,
  currentNode: null,
  travelTarget: null,
  travelCompletedRef: { current: false },
  onTravelComplete: vi.fn(),
  activeStoryFlags: []
}

describe('OverworldMap cityStates lookup', () => {
  beforeEach(() => {
    capturedProps.length = 0
  })

  test('passes cityTraits derived from venue.id prefix when cityStates is present', () => {
    render(<OverworldMap {...baseProps} gameMap={makeGameMap(true)} />)

    const gigNodeProps = capturedProps.find(p => p.node?.id === 'node_1_0')
    expect(gigNodeProps).toBeDefined()
    expect(gigNodeProps.cityTraits).toEqual(berlinTraits)
  })

  test('passes undefined cityTraits when gameMap has no cityStates', () => {
    render(<OverworldMap {...baseProps} gameMap={makeGameMap(false)} />)

    const gigNodeProps = capturedProps.find(p => p.node?.id === 'node_1_0')
    expect(gigNodeProps).toBeDefined()
    expect(gigNodeProps.cityTraits).toBeUndefined()
  })

  test('passes undefined cityTraits for START node (no venue.id)', () => {
    render(<OverworldMap {...baseProps} gameMap={makeGameMap(true)} />)

    const startNodeProps = capturedProps.find(p => p.node?.id === 'node_0_0')
    expect(startNodeProps).toBeDefined()
    expect(startNodeProps.cityTraits).toBeUndefined()
  })
})
