import test from 'node:test'
import assert from 'node:assert/strict'
import { TourbusObstacleManager } from '../../src/components/stage/TourbusObstacleManager'

test('TourbusObstacleManager updates active obstacles and prunes stale obstacles via cleanupObstacles', () => {
  const addedChildren = []
  const container = {
    addChild(child) {
      addedChildren.push(child)
    }
  }

  const effectManager = {
    spawnHitEffect() {}
  }

  const textures = {
    rock: null,
    barrier: null,
    fuel: null,
    voidHazard: null
  }

  const colors = {
    warningYellow: 0xffff00,
    bloodRed: 0xff0000,
    toxicGreen: 0x00ff00,
    voidPurple: 0x800080
  }

  const manager = new TourbusObstacleManager(
    container,
    effectManager,
    textures,
    colors
  )

  const initialState = {
    obstacles: [
      { id: 'obs-1', type: 'FUEL', lane: 0, y: 20, collided: false },
      { id: 'obs-2', type: 'OBSTACLE', lane: 1, y: 50, collided: false }
    ]
  }

  // Pass 1: Render 2 active obstacles
  manager.updateObstacles(initialState, 600, 100)
  manager.cleanupObstacles()

  assert.equal(manager.obstacleMap.size, 2)
  assert.ok(manager.obstacleMap.has('obs-1'))
  assert.ok(manager.obstacleMap.has('obs-2'))

  const obs1Sprite = manager.obstacleMap.get('obs-1')
  const obs2Sprite = manager.obstacleMap.get('obs-2')

  let obs1Destroyed = false
  let obs2Destroyed = false

  obs1Sprite.destroy = () => {
    obs1Destroyed = true
  }
  obs2Sprite.destroy = () => {
    obs2Destroyed = true
  }

  // Pass 2: 'obs-1' moves out of view, only 'obs-2' remains
  const updatedState = {
    obstacles: [
      { id: 'obs-2', type: 'OBSTACLE', lane: 1, y: 70, collided: false }
    ]
  }

  manager.updateObstacles(updatedState, 600, 100)
  manager.cleanupObstacles()

  assert.equal(manager.obstacleMap.size, 1)
  assert.equal(manager.obstacleMap.has('obs-1'), false)
  assert.equal(manager.obstacleMap.has('obs-2'), true)
  assert.equal(obs1Destroyed, true)
  assert.equal(obs2Destroyed, false)
})

test('TourbusObstacleManager dispose cleans up all sprites and maps', () => {
  const container = {
    addChild() {}
  }
  const effectManager = {
    spawnHitEffect() {}
  }
  const manager = new TourbusObstacleManager(
    container,
    effectManager,
    { rock: null, barrier: null, fuel: null, voidHazard: null },
    { warningYellow: 0, bloodRed: 0, toxicGreen: 0, voidPurple: 0 }
  )

  let destroyedCount = 0
  const fakeSprite = {
    destroy() {
      destroyedCount++
    }
  }

  manager.obstacleMap.set('test-1', fakeSprite)
  manager.obstacleMap.set('test-2', fakeSprite)

  manager.dispose()

  assert.equal(destroyedCount, 2)
  assert.equal(manager.obstacleMap.size, 0)
  assert.equal(manager.currentIds.size, 0)
})
