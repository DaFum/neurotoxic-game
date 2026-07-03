/**
 * browser-launcher.js
 *
 * Provides robust Playwright browser launching with fallback strategies for
 * environments with network constraints or missing Playwright browser binaries.
 *
 * Strategies (in order):
 * 1. Try downloading latest Playwright browser (requires CDN access)
 * 2. Fallback to a pre-installed Chromium found under any of:
 *      - $PLAYWRIGHT_BROWSERS_PATH (managed/CI environments set this)
 *      - /opt/pw-browsers          (common managed-container location)
 *      - ~/.cache/ms-playwright     (Playwright default)
 * 3. Fallback to BROWSER_PATH environment variable if provided
 * 4. Provide helpful error with recovery steps
 *
 * Usage:
 *   import { launchBrowserWithFallback } from './browser-launcher.js'
 *   const browser = await launchBrowserWithFallback({ headless: true })
 */

import { chromium } from 'playwright'
import { readdirSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { homedir } from 'node:os'

const DEFAULT_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--mute-audio',
  '--disable-webgl'
]

/**
 * Roots to probe for a pre-installed Playwright Chromium, in priority order.
 * Managed/CI containers frequently pre-populate `/opt/pw-browsers` and export
 * `PLAYWRIGHT_BROWSERS_PATH`, which the previous cache-only search missed.
 */
function browserSearchRoots() {
  const roots = []
  const envRoot = process.env.PLAYWRIGHT_BROWSERS_PATH
  // PLAYWRIGHT_BROWSERS_PATH="0" selects Playwright's hermetic install
  // (node_modules/.local-browsers), which the standard launch (strategy 1) already
  // resolves; it is not a real directory here, so the existsSync filter drops it.
  if (envRoot) roots.push(envRoot)
  roots.push('/opt/pw-browsers')
  roots.push(resolve(homedir(), '.cache', 'ms-playwright'))
  return [...new Set(roots)].filter(r => existsSync(r))
}

function platformChromePaths() {
  if (process.platform === 'win32') {
    return [['chrome-win', 'chrome.exe']]
  }
  if (process.platform === 'darwin') {
    return [['chrome-mac', 'Chromium.app/Contents/MacOS/Chromium']]
  }
  // Linux: prefer full chrome, fall back to the headless_shell build that
  // many CI images ship instead of (or alongside) the full browser.
  return [
    ['chrome-linux', 'chrome'],
    ['chrome-linux', 'headless_shell']
  ]
}

async function findCachedBrowser() {
  const platformPaths = platformChromePaths()

  for (const root of browserSearchRoots()) {
    try {
      const browsers = readdirSync(root, { withFileTypes: true })
        .filter(d => d.isDirectory() && d.name.includes('chromium'))
        .sort((a, b) => {
          // Full "chromium-*" builds before "chromium_headless_shell-*", then
          // by version number descending (most recent first).
          const aShell = a.name.includes('headless_shell')
          const bShell = b.name.includes('headless_shell')
          if (aShell !== bShell) return aShell ? 1 : -1
          const aVer = parseInt((a.name.match(/\d+/) ?? ['0'])[0], 10)
          const bVer = parseInt((b.name.match(/\d+/) ?? ['0'])[0], 10)
          return bVer - aVer
        })

      for (const browser of browsers) {
        for (const [platformPath, exeName] of platformPaths) {
          const chromePath = join(root, browser.name, platformPath, exeName)
          if (existsSync(chromePath)) {
            return chromePath
          }
        }
      }
    } catch (_error) {
      // Unreadable root — try the next one.
    }
  }

  return null
}

async function launchBrowserWithFallback(options = {}) {
  const {
    headless = true,
    slowMo = 0,
    args = DEFAULT_ARGS,
    timeout = 30000
  } = options

  const browserPath = process.env.BROWSER_PATH

  // Strategy 1: Try standard Playwright launch (downloads if needed)
  try {
    console.log('🌐 Attempting to launch Chromium (standard)...')
    const browser = await chromium.launch({
      headless,
      slowMo,
      args,
      timeout
    })
    console.log('✓ Chromium launched (downloaded)')
    return browser
  } catch (error) {
    if (!error.message.includes("Executable doesn't exist")) {
      throw error
    }
    console.log(
      '⚠ Standard launch failed (CDN unreachable), trying fallbacks...'
    )
  }

  // Strategy 2: Try cached browser
  const cachedBrowserPath = await findCachedBrowser()
  if (cachedBrowserPath) {
    try {
      console.log(`  Trying cached browser: ${cachedBrowserPath}`)
      const browser = await chromium.launch({
        executablePath: cachedBrowserPath,
        headless,
        slowMo,
        args,
        timeout
      })
      console.log('✓ Chromium launched (from cache)')
      return browser
    } catch (error) {
      console.log(`  ✗ Cached browser failed: ${error.message.split('\n')[0]}`)
    }
  }

  // Strategy 3: Try BROWSER_PATH env var
  if (browserPath && existsSync(browserPath)) {
    try {
      console.log(`  Trying BROWSER_PATH: ${browserPath}`)
      const browser = await chromium.launch({
        executablePath: browserPath,
        headless,
        slowMo,
        args,
        timeout
      })
      console.log('✓ Chromium launched (BROWSER_PATH)')
      return browser
    } catch (error) {
      console.log(
        `  ✗ BROWSER_PATH browser failed: ${error.message.split('\n')[0]}`
      )
    }
  }

  // All strategies failed
  const errorMsg = `
❌ Browser Launch Failed

No Playwright Chromium browser available. Tried:
  1. CDN download (storage.googleapis.com unreachable)
  2. Pre-installed Chromium under: ${browserSearchRoots().join(', ') || '(no candidate roots exist)'}
  ${browserPath ? `3. BROWSER_PATH env var (${browserPath} doesn't exist)` : '3. BROWSER_PATH env var not set'}

Recovery options:
  a) Provide network access to storage.googleapis.com (CDN)
  b) Point PLAYWRIGHT_BROWSERS_PATH at a directory containing a chromium-* build,
     or copy one into /opt/pw-browsers or ~/.cache/ms-playwright
  c) Provide the browser executable directly via env var:
     BROWSER_PATH=/path/to/chrome node script.js

For air-gapped environments, contact your sysadmin to pre-populate browser caches.
  `.trim()

  throw new Error(errorMsg)
}

export { launchBrowserWithFallback, findCachedBrowser }
