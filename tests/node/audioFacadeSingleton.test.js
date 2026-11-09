import assert from 'node:assert/strict'
import { test } from 'node:test'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

/**
 * Real `audioEngine.ts` hub, `AudioManager.ts` and `audioService.ts` with only
 * Tone mocked. ESM caches a module per process, so each import order runs in a
 * fresh child process: otherwise the first order would decide the evaluation
 * order for all three.
 */
const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url))
const MODULE_URLS = {
  hub: new URL('../../src/utils/audio/audioEngine.ts', import.meta.url).href,
  manager: new URL('../../src/utils/audio/AudioManager.ts', import.meta.url)
    .href,
  service: new URL('../../src/utils/audio/audioService.ts', import.meta.url)
    .href
}
const MOCK_UTILS_URL = new URL('../mockUtils.js', import.meta.url).href
const REPORT_MARKER = 'AUDIO_FACADE_REPORT '

const childScript = order => `
import { mock } from 'node:test'
const { createMockTone } = await import(${JSON.stringify(MOCK_UTILS_URL)})
mock.module('tone', { namedExports: createMockTone() })

const urls = ${JSON.stringify(MODULE_URLS)}
const loaded = {}
for (const name of ${JSON.stringify(order)}) loaded[name] = await import(urls[name])
const { audioManager } = loaded.manager
const { audioService } = loaded.service

// Let zero-delay init timers fire; only a long-lived timer should remain.
await new Promise(resolve => setTimeout(resolve, 100))
const report = {
  hubManagerIsManager: loaded.hub.audioManager === audioManager,
  hubServiceIsService: loaded.hub.audioService === audioService,
  prefsLoadedAtImport: audioManager.prefsLoaded,
  // #3654: an import-time timer keeps the process alive for seconds.
  pendingTimersAfterImport: process
    .getActiveResourcesInfo()
    .filter(resource => resource === 'Timeout').length
}
audioService.setMusicVolume(0.25)
audioService.setSfxVolume(0.75)
report.managerVolumes = [audioManager.musicVolume, audioManager.sfxVolume]
report.toggleMute = [audioService.toggleMute(), audioManager.muted]
let notified = 0
const unsubscribe = audioService.subscribe(() => notified++)
audioManager.setMusicVolume(0.5)
unsubscribe()
report.serviceNotified = notified
report.serviceMusicVol = audioService.getState().musicVol
process.stdout.write(${JSON.stringify(REPORT_MARKER)} + JSON.stringify(report) + '\\n')
`

const runImportOrder = order => {
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_'))
  )
  const result = spawnSync(
    process.execPath,
    [
      '--import',
      'tsx',
      '--experimental-test-module-mocks',
      '--import',
      './tests/setup.mjs',
      '--input-type=module',
      '--eval',
      childScript(order)
    ],
    { cwd: REPO_ROOT, env, encoding: 'utf8', timeout: 60_000 }
  )
  assert.equal(
    result.status,
    0,
    `child for ${order.join(' -> ')} failed:\n${result.stderr}`
  )
  const line = result.stdout
    .split('\n')
    .find(entry => entry.startsWith(REPORT_MARKER))
  assert.ok(line, `no report from child:\n${result.stdout}\n${result.stderr}`)
  return JSON.parse(line.slice(REPORT_MARKER.length))
}

const IMPORT_ORDERS = {
  'hub-first': ['hub', 'manager', 'service'],
  'manager-first': ['manager', 'service', 'hub'],
  'service-first': ['service', 'hub', 'manager']
}

for (const [label, order] of Object.entries(IMPORT_ORDERS)) {
  test(`${label} import order keeps one audioManager and a delegating audioService`, () => {
    const report = runImportOrder(order)
    assert.deepEqual(report, {
      hubManagerIsManager: true,
      hubServiceIsService: true,
      prefsLoadedAtImport: true,
      pendingTimersAfterImport: 0,
      managerVolumes: [0.25, 0.75],
      toggleMute: [true, true],
      serviceNotified: 1,
      serviceMusicVol: 0.5
    })
  })
}
