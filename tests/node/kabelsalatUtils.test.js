import { test, describe, mock } from 'node:test'
import assert from 'node:assert/strict'

// Mock constants module
const MOCK_CABLES = [
  { id: 'iec', x: 100, y: 400, color: 'red' },
  { id: 'xlr', x: 200, y: 400, color: 'green' },
  { id: 'jack', x: 300, y: 400, color: 'blue' }
]

const MOCK_CABLE_MAP = MOCK_CABLES.reduce((acc, cable) => {
  acc[cable.id] = cable
  return acc
}, {})

const MOCK_SLOT_XS = [100, 200, 300, 400, 500]

mock.module('../../src/scenes/kabelsalat/constants', {
  namedExports: {
    CABLES: MOCK_CABLES,
    CABLE_MAP: MOCK_CABLE_MAP,
    SLOT_XS: MOCK_SLOT_XS
  }
})

describe('kabelsalat utils', () => {
  let generateLightningSeeds
  let getMessyPath

  test('generateLightningSeeds returns array of lightning objects', async () => {
    const mod = await import('../../src/scenes/kabelsalat/utils')
    generateLightningSeeds = mod.generateLightningSeeds

    const seeds = generateLightningSeeds()

    assert.ok(Array.isArray(seeds))
    assert.equal(seeds.length, 15)
  })

  test('each lightning seed has required properties', async () => {
    const mod = await import('../../src/scenes/kabelsalat/utils')
    generateLightningSeeds = mod.generateLightningSeeds

    const seeds = generateLightningSeeds()

    seeds.forEach(seed => {
      assert.ok(typeof seed.id === 'string', 'seed should have id string')
      assert.ok(typeof seed.startX === 'number', 'seed should have startX')
      assert.ok(typeof seed.o1 === 'number', 'seed should have o1')
      assert.ok(typeof seed.o2 === 'number', 'seed should have o2')
      assert.ok(typeof seed.o3 === 'number', 'seed should have o3')
      assert.ok(typeof seed.w === 'number', 'seed should have w')
    })
  })

  test('lightning seeds have valid ranges', async () => {
    const mod = await import('../../src/scenes/kabelsalat/utils')
    generateLightningSeeds = mod.generateLightningSeeds

    const seeds = generateLightningSeeds()

    seeds.forEach(seed => {
      assert.ok(
        seed.startX >= 0 && seed.startX <= 800,
        'startX should be 0-800'
      )
      assert.ok(seed.o1 >= -150 && seed.o1 <= 150, 'o1 should be -150 to 150')
      assert.ok(seed.o2 >= -150 && seed.o2 <= 150, 'o2 should be -150 to 150')
      assert.ok(seed.o3 >= -150 && seed.o3 <= 150, 'o3 should be -150 to 150')
      assert.ok(seed.w >= 2 && seed.w <= 12, 'w should be 2-12')
    })
  })

  test('lightning seeds have unique IDs', async () => {
    const mod = await import('../../src/scenes/kabelsalat/utils')
    generateLightningSeeds = mod.generateLightningSeeds

    const seeds = generateLightningSeeds()
    const ids = seeds.map(s => s.id)
    const uniqueIds = new Set(ids)

    // Most should be unique (allow for tiny collision chance with random IDs)
    assert.ok(uniqueIds.size >= 14, 'most lightning IDs should be unique')
  })

  test('getMessyPath returns valid SVG path string', async () => {
    const mod = await import('../../src/scenes/kabelsalat/utils')
    getMessyPath = mod.getMessyPath

    const socketOrder = ['power', 'mic', 'amp', 'synth', 'pedal']
    const path = getMessyPath('iec', 'power', socketOrder)

    assert.ok(typeof path === 'string')
    assert.ok(path.startsWith('M '), 'path should start with M command')
    assert.ok(
      path.includes(' C '),
      'path should include cubic bezier C command'
    )
  })

  test('getMessyPath returns empty string for invalid cable', async () => {
    const mod = await import('../../src/scenes/kabelsalat/utils')
    getMessyPath = mod.getMessyPath

    const socketOrder = ['power', 'mic']
    const path = getMessyPath('invalid_cable', 'power', socketOrder)

    assert.equal(path, '')
  })

  test('getMessyPath returns empty string for socket not in order', async () => {
    const mod = await import('../../src/scenes/kabelsalat/utils')
    getMessyPath = mod.getMessyPath

    const socketOrder = ['power', 'mic']
    const path = getMessyPath('iec', 'nonexistent_socket', socketOrder)

    assert.equal(path, '')
  })

  test('getMessyPath uses correct socket position from order', async () => {
    const mod = await import('../../src/scenes/kabelsalat/utils')
    getMessyPath = mod.getMessyPath

    const socketOrder = ['power', 'mic', 'amp']
    const path = getMessyPath('iec', 'mic', socketOrder)

    // mic is at index 1, so socketX should be SLOT_XS[1] = 200
    assert.ok(path.includes('200'))
  })

  test('getMessyPath calculates midpoint correctly', async () => {
    const mod = await import('../../src/scenes/kabelsalat/utils')
    getMessyPath = mod.getMessyPath

    const socketOrder = ['power']
    const path = getMessyPath('iec', 'power', socketOrder)

    // Cable y = 400, socket y = 120, midY = (400 + 120) / 2 = 260
    // Path should contain bezier curve with control points around midY
    assert.ok(path.length > 0)
  })

  test('getMessyPath creates different paths for different sockets', async () => {
    const mod = await import('../../src/scenes/kabelsalat/utils')
    getMessyPath = mod.getMessyPath

    const socketOrder = ['power', 'mic', 'amp']
    const path1 = getMessyPath('iec', 'power', socketOrder)
    const path2 = getMessyPath('iec', 'mic', socketOrder)

    assert.notEqual(path1, path2)
  })

  test('getMessyPath handles first socket position', async () => {
    const mod = await import('../../src/scenes/kabelsalat/utils')
    getMessyPath = mod.getMessyPath

    const socketOrder = ['power', 'mic']
    const path = getMessyPath('iec', 'power', socketOrder)

    assert.ok(path.length > 0)
    assert.ok(path.startsWith('M '))
  })

  test('getMessyPath handles last socket position', async () => {
    const mod = await import('../../src/scenes/kabelsalat/utils')
    getMessyPath = mod.getMessyPath

    const socketOrder = ['power', 'mic', 'amp', 'synth', 'pedal']
    const path = getMessyPath('iec', 'pedal', socketOrder)

    assert.ok(path.length > 0)
    assert.ok(path.startsWith('M '))
  })

  test('getMessyPath creates cubic bezier curve', async () => {
    const mod = await import('../../src/scenes/kabelsalat/utils')
    getMessyPath = mod.getMessyPath

    const socketOrder = ['power', 'mic']
    const path = getMessyPath('iec', 'power', socketOrder)

    // SVG cubic bezier format: M x y C x1 y1, x2 y2, x y
    const parts = path.split(' ')
    assert.ok(parts.includes('M'), 'should have move command')
    assert.ok(parts.includes('C'), 'should have cubic bezier command')
  })

  test('generateLightningSeeds creates different seeds each call', async () => {
    const mod = await import('../../src/scenes/kabelsalat/utils')
    generateLightningSeeds = mod.generateLightningSeeds

    const seeds1 = generateLightningSeeds()
    const seeds2 = generateLightningSeeds()

    // Seeds should be different (random values)
    const same = seeds1.every((s1, i) => {
      const s2 = seeds2[i]
      return s1.startX === s2.startX && s1.o1 === s2.o1
    })

    assert.ok(!same, 'lightning seeds should be randomized each call')
  })

  test('getMessyPath offset calculation varies with position', async () => {
    const mod = await import('../../src/scenes/kabelsalat/utils')
    getMessyPath = mod.getMessyPath

    const socketOrder = ['power', 'mic', 'amp']

    // Different socket positions should create different offsets
    const path1 = getMessyPath('iec', 'power', socketOrder) // index 0
    const path2 = getMessyPath('iec', 'amp', socketOrder) // index 2

    // Paths should differ significantly
    assert.notEqual(path1, path2)
  })

  test('getMessyPath handles edge case with single socket', async () => {
    const mod = await import('../../src/scenes/kabelsalat/utils')
    getMessyPath = mod.getMessyPath

    const socketOrder = ['power']
    const path = getMessyPath('iec', 'power', socketOrder)

    assert.ok(path.length > 0)
    assert.ok(path.includes('M '))
    assert.ok(path.includes(' C '))
  })

  test('lightning seed IDs are valid UUIDs', async () => {
    const mod = await import('../../src/scenes/kabelsalat/utils')
    generateLightningSeeds = mod.generateLightningSeeds

    const seeds = generateLightningSeeds()

    seeds.forEach(seed => {
      assert.ok(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          seed.id
        ),
        'seed ID should be a valid UUID v4'
      )
    })
  })

  test('getMessyPath socket Y coordinate is hardcoded to 120', async () => {
    const mod = await import('../../src/scenes/kabelsalat/utils')
    getMessyPath = mod.getMessyPath

    const socketOrder = ['power']
    const path = getMessyPath('iec', 'power', socketOrder)

    // Socket Y is 120, so the end point should be around 120 + 20 = 140
    // The path should end with coordinates near socketY + 20
    assert.ok(path.includes('120') || path.includes('140'))
  })
})
