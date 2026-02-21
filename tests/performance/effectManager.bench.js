import { performance } from 'node:perf_hooks'
import * as PIXI from 'pixi.js'

const ITERATIONS = 10000

function runBaseline() {
  const container = new PIXI.Container()
  const start = performance.now()
  for (let i = 0; i < ITERATIONS; i++) {
    const effect = new PIXI.Graphics()
    effect.clear() // Simulate the code
    effect.circle(0, 0, 40)
    effect.fill({ color: 0xFFFFFF, alpha: 0.8 })
    effect.stroke({ width: 4, color: 0xFF0000 })

    // Mimic property setting
    effect.x = 100
    effect.y = 100
    effect.alpha = 1
    effect.scale.set(0.5)
    effect.visible = true

    container.addChild(effect)
  }
  const end = performance.now()
  container.destroy({ children: true })
  return end - start
}

function runOptimized() {
  // Pre-allocate texture simulation
  const texture = PIXI.Texture.WHITE
  const container = new PIXI.Container()

  const start = performance.now()
  for (let i = 0; i < ITERATIONS; i++) {
    const effect = new PIXI.Sprite(texture)
    effect.anchor.set(0.5)
    effect.tint = 0xFF0000

    // Mimic property setting
    effect.x = 100
    effect.y = 100
    effect.alpha = 1
    effect.scale.set(0.5)
    effect.visible = true

    container.addChild(effect)
  }
  const end = performance.now()
  container.destroy({ children: true })
  return end - start
}

console.log(`Benchmarking with ${ITERATIONS} iterations...`)

// Warmup
runBaseline()
runOptimized()

const baselineTime = runBaseline()
console.log(`Baseline (New Graphics per effect): ${baselineTime.toFixed(2)}ms`)

const optimizedTime = runOptimized()
console.log(`Optimized (Reuse Sprite w/ Texture): ${optimizedTime.toFixed(2)}ms`)

const improvement = baselineTime - optimizedTime
const percent = (improvement / baselineTime) * 100
console.log(`Improvement: ${improvement.toFixed(2)}ms (${percent.toFixed(1)}%)`)
