import test from 'node:test'
import assert from 'node:assert/strict'
import { RoadiePlayerManager } from '../../src/components/stage/RoadiePlayerManager'

test('RoadiePlayerManager updates carrying visuals on initial call and short-circuits on unchanged state', () => {
  const container = {
    addChild() {}
  }
  const manager = new RoadiePlayerManager(
    {
      roadie: null,
      items: {
        AMP: { width: 100, height: 100 }
      }
    },
    { bloodRed: 0xff0000, starWhite: 0xffffff, toxicGreen: 0x00ff00 }
  )

  manager.setup(container, 100, 100)

  let setScaleCallCount = 0
  if (manager.itemSprite) {
    const originalSet = manager.itemSprite.scale.set.bind(manager.itemSprite.scale)
    manager.itemSprite.scale.set = (...args) => {
      setScaleCallCount++
      return originalSet(...args)
    }
  }

  const state = {
    playerPos: { x: 0, y: 0 },
    carrying: { type: 'AMP' },
    equipmentDamage: 0
  }

  // 1. Initial call should update carrying visuals (setScaleCallCount increments to 1)
  manager.updateCarryingVisuals(state, 100, 100)
  assert.equal(setScaleCallCount, 1)
  assert.equal(manager.itemSprite.visible, true)

  // 2. Second call with identical state should short-circuit (setScaleCallCount stays 1)
  manager.updateCarryingVisuals(state, 100, 100)
  assert.equal(setScaleCallCount, 1)

  // 3. Third call with changed carrying item type should re-evaluate and update
  const stateNewItem = {
    playerPos: { x: 0, y: 0 },
    carrying: { type: 'DRUMS' },
    equipmentDamage: 0
  }
  manager.updateCarryingVisuals(stateNewItem, 100, 100)
  assert.equal(setScaleCallCount, 2)

  // 4. Call with carrying = null should update visibility and short-circuit on repeat
  const stateNoItem = {
    playerPos: { x: 0, y: 0 },
    carrying: null,
    equipmentDamage: 0
  }
  manager.updateCarryingVisuals(stateNoItem, 100, 100)
  assert.equal(manager.itemSprite.visible, false)

  const callsBeforeRepeat = setScaleCallCount
  manager.updateCarryingVisuals(stateNoItem, 100, 100)
  assert.equal(setScaleCallCount, callsBeforeRepeat)
})

test('RoadiePlayerManager handles damage flash transitions and resets tint correctly', async () => {
  const container = {
    addChild() {}
  }
  const manager = new RoadiePlayerManager(
    {
      roadie: null,
      items: {
        CONTRABAND: { width: 100, height: 100 }
      }
    },
    { bloodRed: 0xff0000, starWhite: 0xffffff, toxicGreen: 0x00ff00 }
  )

  manager.setup(container, 100, 100)

  const stateContraband = {
    playerPos: { x: 0, y: 0 },
    carrying: { type: 'CONTRABAND' },
    equipmentDamage: 0
  }

  // Initial update sets player tint to toxicGreen
  manager.updateCarryingVisuals(stateContraband, 100, 100)
  assert.equal(manager.playerSprite.tint, 0x00ff00)

  // Damage trigger flashes player red
  stateContraband.equipmentDamage = 10
  manager.checkDamageTriggers(stateContraband)
  assert.equal(manager.playerSprite.tint, 0xff0000)

  // Call updateCarryingVisuals during active flash (isFlashing = true)
  manager.updateCarryingVisuals(stateContraband, 100, 100)
  assert.equal(manager.lastWasFlashing, true)

  // Wait for flash timeout to complete
  await new Promise(resolve => setTimeout(resolve, 250))

  // Flash finished: playerSprite tint restored to toxicGreen
  assert.equal(manager.playerSprite.tint, 0x00ff00)

  // Next updateCarryingVisuals detects isFlashing (false) !== lastWasFlashing (true)
  // and re-synchronizes cleanly
  manager.updateCarryingVisuals(stateContraband, 100, 100)
  assert.equal(manager.lastWasFlashing, false)
  assert.equal(manager.playerSprite.tint, 0x00ff00)
})
