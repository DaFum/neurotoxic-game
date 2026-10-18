import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'

const nodeProps = []
const connectionProps = []
vi.mock('../../src/components/MapNodeView', () => ({
  MapNodeView: props => {
    nodeProps.push(props)
    return <div data-testid='map-node' />
  }
}))

vi.mock('../../src/components/MapConnection', () => ({
  MapConnection: props => {
    connectionProps.push(props)
    return <g data-testid='map-connection' />
  }
}))

vi.mock('../../src/utils/imageGen', () => ({
  isImageGenerationAvailable: () => false,
  resolveGenImageUrl: () => 'mock-url',
  getGeneratedImageFallbackUrl: () => 'mock-fallback',
  getGenImageUrl: prompt => `mock-image-${prompt ?? 'missing'}`,
  IMG_PROMPTS: {}
}))

vi.mock('../../src/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => true
}))

const { OverworldMap } =
  await import('../../src/components/overworld/OverworldMap.tsx')

const node = (id, type, layer, x) => ({
  id,
  type,
  layer,
  x,
  y: 50,
  venue: null,
  connections: []
})

// The base map reaches node_1_0 only; the overlay adds node_1_1.
const travelMap = {
  nodes: {
    node_0_0: node('node_0_0', 'START', 0, 10),
    node_1_0: node('node_1_0', 'GIG', 1, 50),
    node_1_1: node('node_1_1', 'GIG', 1, 70)
  },
  nodeList: [],
  connections: [
    { from: 'node_0_0', to: 'node_1_0' },
    { from: 'node_0_0', to: 'node_1_1' }
  ],
  layers: [['node_0_0'], ['node_1_0', 'node_1_1']]
}

const baseProps = {
  t: key => key,
  gameMap: travelMap,
  player: { currentNodeId: 'node_0_0', money: 500, fame: 10, day: 1 },
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
  activeStoryFlags: []
}

describe('OverworldMap overlay wiring', () => {
  beforeEach(() => {
    nodeProps.length = 0
    connectionProps.length = 0
  })

  test('draws an overlay edge carried by the travel map', () => {
    render(<OverworldMap {...baseProps} />)
    const edges = connectionProps.map(p => `${p.start.id}>${p.end.id}`)
    expect(edges).toContain('node_0_0>node_1_1')
  })

  test('hands the advertised subtype to the node but keeps its base type', () => {
    render(
      <OverworldMap
        {...baseProps}
        overlaySubtypeByNodeId={{ node_1_1: 'RIVAL_ENCOUNTER' }}
      />
    )
    const overlay = nodeProps.find(p => p.node.id === 'node_1_1')
    expect(overlay.overlaySubtype).toBe('RIVAL_ENCOUNTER')
    expect(overlay.node.type).toBe('GIG')
    const plain = nodeProps.find(p => p.node.id === 'node_1_0')
    expect(plain.overlaySubtype).toBeUndefined()
  })

  test('uses the special pin for an overlay destination', () => {
    render(<OverworldMap {...baseProps} />)
    const plainIcon = nodeProps.find(p => p.node.id === 'node_1_1').iconUrl
    nodeProps.length = 0
    render(
      <OverworldMap
        {...baseProps}
        overlaySubtypeByNodeId={{ node_1_1: 'UNDERGROUND_MARKET' }}
      />
    )
    const overlayIcon = nodeProps.find(p => p.node.id === 'node_1_1').iconUrl
    expect(overlayIcon).not.toBe(plainIcon)
  })
})
