/**
 * browser-launcher.js
 *
 * Provides robust Playwright browser launching with fallback strategies for
 * environments with network constraints or missing Playwright browser binaries.
 *
 * Strategies (in order):
 * 1. Try downloading latest Playwright browser (requires CDN access)
 * 2. Fallback to cached Chromium from ~/.cache/ms-playwright/
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

async function findCachedBrowser() {
  const cacheDir = resolve(homedir(), '.cache', 'ms-playwright')

  // Cross-platform browser discovery (no shell commands)
  try {
    if (!existsSync(cacheDir)) {
      return null
    }

    const browsers = readdirSync(cacheDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && d.name.includes('chromium'))
      .sort((a, b) => {
        // Sort by version number (descending) to get most recent
        const aVer = parseInt(a.name.match(/\d+/) || [0], 10)
        const bVer = parseInt(b.name.match(/\d+/) || [0], 10)
        return bVer - aVer
      })

    for (const browser of browsers) {
      const chromePath = join(
        cacheDir,
        browser.name,
        process.platform === 'win32' ? 'chrome-win' : 'chrome-linux',
        process.platform === 'win32' ? 'chrome.exe' : 'chrome'
      )
      if (existsSync(chromePath)) {
        return chromePath
      }
    }
  } catch (_error) {
    // Directory read failed, return null and let fallback handle it
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
  2. Cached browser (~/.cache/ms-playwright) not found
  ${browserPath ? `3. BROWSER_PATH env var (${browserPath} doesn't exist)` : '3. BROWSER_PATH env var not set'}

Recovery options:
  a) Provide network access to storage.googleapis.com (CDN)
  b) Provide cached Chromium binary:
     - Install Playwright on a machine with internet: pnpm install
     - Copy ~/.cache/ms-playwright to this environment
  c) Provide browser executable via env var:
     BROWSER_PATH=/path/to/chrome node script.js

For air-gapped environments, contact your sysadmin to pre-populate browser caches.
  `.trim()

  throw new Error(errorMsg)
}

export { launchBrowserWithFallback, findCachedBrowser }
