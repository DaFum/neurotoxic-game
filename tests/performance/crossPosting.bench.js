import { performance } from 'node:perf_hooks'

const CROSS_POSTING_PLATFORMS = ['instagram', 'tiktok', 'youtube']
const social = { instagram: 100, tiktok: 200, youtube: 300 }
const result = { success: true, platform: 'tiktok' }
const totalFollowers = 1000

function runOldApproach(iterations) {
  let updatedSocial = { ...social }
  for (let i = 0; i < iterations; i++) {
    updatedSocial = { ...social }
    const otherPlatforms = CROSS_POSTING_PLATFORMS.filter(
      p => p !== result.platform
    )
    otherPlatforms.forEach(p => {
      updatedSocial[p] = Math.max(
        0,
        (social[p] || 0) + Math.floor(totalFollowers * 0.25)
      )
    })
  }
  return updatedSocial
}

function runForOfApproach(iterations) {
  let updatedSocial = { ...social }
  for (let i = 0; i < iterations; i++) {
    updatedSocial = { ...social }
    const delta = Math.floor(totalFollowers * 0.25)
    for (const p of CROSS_POSTING_PLATFORMS) {
      if (p !== result.platform) {
        updatedSocial[p] = Math.max(0, (social[p] || 0) + delta)
      }
    }
  }
  return updatedSocial
}

function runUnrolledApproach(iterations) {
  let updatedSocial = { ...social }
  for (let i = 0; i < iterations; i++) {
    updatedSocial = { ...social }
    const delta = Math.floor(totalFollowers * 0.25)
    if (result.platform !== 'instagram') {
      updatedSocial.instagram = Math.max(0, (social.instagram || 0) + delta)
    }
    if (result.platform !== 'tiktok') {
      updatedSocial.tiktok = Math.max(0, (social.tiktok || 0) + delta)
    }
    if (result.platform !== 'youtube') {
      updatedSocial.youtube = Math.max(0, (social.youtube || 0) + delta)
    }
  }
  return updatedSocial
}

const RUNS = 1_000_000

// Warmup
runOldApproach(10000)
runForOfApproach(10000)
runUnrolledApproach(10000)

const startOld = performance.now()
runOldApproach(RUNS)
const timeOld = performance.now() - startOld

const startForOf = performance.now()
runForOfApproach(RUNS)
const timeForOf = performance.now() - startForOf

const startUnrolled = performance.now()
runUnrolledApproach(RUNS)
const timeUnrolled = performance.now() - startUnrolled

console.log(`Old Approach Time: ${timeOld.toFixed(2)}ms`)
console.log(`For...of Approach Time: ${timeForOf.toFixed(2)}ms`)
console.log(`Unrolled Approach Time: ${timeUnrolled.toFixed(2)}ms`)
console.log(
  `Total Improvement (Unrolled vs Old): ${(((timeOld - timeUnrolled) / timeOld) * 100).toFixed(2)}% faster`
)
console.log(
  `Incremental Improvement (Unrolled vs For...of): ${(((timeForOf - timeUnrolled) / timeForOf) * 100).toFixed(2)}% faster`
)
