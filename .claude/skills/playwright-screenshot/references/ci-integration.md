# CI Integration Guide

How to run Playwright screenshots and visual regression tests in GitHub Actions CI.

---

## Project CI Configuration

The existing `playwright.config.js` already provides a solid baseline:

- **Base URL:** `http://localhost:5173`
- **Dev server:** auto-started via `npm run dev` (use `pnpm run dev` — see below)
- **Browser:** Chromium Desktop only
- **Workers:** 1 (serial — prevents audio/WebGL conflicts)
- **Flags:** `--no-sandbox`, `--disable-gpu`, `--mute-audio`, `--disable-webgl`

**One fix needed:** The `webServer.command` uses `npm run dev` but the project uses `pnpm`.
Update `playwright.config.js` if it hasn't been updated yet:

```js
webServer: {
  command: 'pnpm run dev',   // ← was 'npm run dev'
  url: 'http://localhost:5173',
  reuseExistingServer: !process.env.CI,
  stdout: 'ignore',
  stderr: 'pipe'
}
```

---

## Minimal CI Workflow

```yaml
# .github/workflows/visual-regression.yml
name: Visual Regression

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  visual:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm exec playwright install chromium --with-deps

      - name: Run visual regression tests
        run: pnpm exec playwright test e2e/visual.spec.js

      - name: Upload test artifacts on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-visual-results
          path: |
            e2e/__snapshots__/
            test-results/
          retention-days: 7
```

---

## Running All E2E Tests in CI

```yaml
      - name: Run all E2E tests
        run: pnpm exec playwright test
        env:
          CI: true
          # Chromium path if needed in specific environments:
          # CHROME_PATH: /usr/bin/chromium-browser
```

---

## Running the Screenshot Scripts in CI

The `screenshot-all-scenes.js` and `screenshot-state-inject.js` scripts
use `@playwright/test`'s `chromium` directly (not via the test runner).
They need the dev server running.

```yaml
      - name: Start dev server
        run: pnpm run dev &
        env:
          CI: true

      - name: Wait for dev server
        run: pnpm exec wait-on http://localhost:5173 --timeout 30000

      - name: Capture all scenes
        run: |
          node .claude/skills/playwright-screenshot/scripts/screenshot-all-scenes.js
        env:
          BASE_URL: http://localhost:5173
          OUT_DIR: screenshots/ci-run
          HEADLESS: true

      - name: Upload scene screenshots
        uses: actions/upload-artifact@v4
        with:
          name: scene-screenshots
          path: screenshots/ci-run/
```

> Install `wait-on` if not present: `pnpm add -D wait-on`

---

## Updating Snapshot Baselines

When a UI change intentionally changes visuals, update the baseline:

```bash
# Locally: update all snapshots
pnpm exec playwright test e2e/visual.spec.js --update-snapshots

# Update a specific snapshot
pnpm exec playwright test e2e/visual.spec.js -g "MainMenu loads correctly" --update-snapshots
```

In CI (PR workflow) — add a manual trigger to update baselines:

```yaml
on:
  workflow_dispatch:
    inputs:
      update_snapshots:
        description: 'Update visual snapshots'
        type: boolean
        default: false

jobs:
  visual:
    steps:
      # ...
      - name: Run tests (optionally update snapshots)
        run: |
          if [ "${{ inputs.update_snapshots }}" = "true" ]; then
            pnpm exec playwright test e2e/visual.spec.js --update-snapshots
          else
            pnpm exec playwright test e2e/visual.spec.js
          fi

      - name: Commit updated snapshots
        if: inputs.update_snapshots
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add e2e/__snapshots__/
          git commit -m "chore: update visual regression snapshots" || echo "No changes"
          git push
```

---

## Tolerance Configuration

The game uses animated elements (Framer Motion, CRT scanlines). Set appropriate tolerances
to avoid flaky failures from minor pixel-level animation differences.

```js
// e2e/visual.spec.js
expect(await page.screenshot()).toMatchSnapshot('menu.png', {
  maxDiffPixelRatio: 0.05   // 5% tolerance (recommended for game UIs)
})

// Stricter for static UI elements
expect(await element.screenshot()).toMatchSnapshot('button.png', {
  maxDiffPixelRatio: 0.02
})

// More lenient for animated scenes (canvas, transitions)
expect(await page.screenshot()).toMatchSnapshot('gig.png', {
  maxDiffPixelRatio: 0.15
})
```

---

## Disabling CRT for Stable Baselines

The CRT scanline overlay (`crtEnabled`) adds noise to screenshots. Disable it
via the injected state fixture for consistent baselines:

```js
// In your visual test or fixture:
await page.evaluate(() => {
  const settings = JSON.parse(
    localStorage.getItem('neurotoxic_global_settings') || '{}'
  )
  settings.crtEnabled = false
  localStorage.setItem('neurotoxic_global_settings', JSON.stringify(settings))
})
await page.reload({ waitUntil: 'networkidle' })
```

Or set it in the `screenshot-state-inject.js` global settings object:
```js
const globalSettings = { tutorialSeen: true, crtEnabled: false }  // ← false
```

---

## Common CI Failures and Fixes

| Failure | Cause | Fix |
|---------|-------|-----|
| `browserType.launch: Failed to launch chromium` | Missing system deps | Add `playwright install --with-deps` |
| `net::ERR_CONNECTION_REFUSED` | Dev server not ready | Use `wait-on` before test step |
| `snapshot.png does not exist` | First run, no baseline yet | Run with `--update-snapshots` once |
| `maxDiffPixelRatio exceeded` | Animation frame timing | Increase tolerance or add `waitForTimeout` |
| `page crashed` | Audio init in Chromium | Already handled by `--mute-audio` flag |
| `canvas` always blank | WebGL disabled, Pixi not falling back | Pixi falls back to Canvas2D automatically — add 500 ms wait |
| `timeout: waiting for locator` | Scene lazy-load timing | Use `waitForLoadState('networkidle')` before assertion |

---

## Snapshot Storage Location

Playwright stores snapshots adjacent to the spec file by default:

```
e2e/
├── visual.spec.js
└── visual.spec.js-snapshots/
    ├── main-menu-baseline-chromium-linux.png
    └── ...
```

The OS and browser name are appended automatically. Baselines generated on macOS
**will not match** when run on Linux CI. Always generate baselines in the same OS
as your CI runner, or use a Docker container locally:

```bash
# Generate baselines inside a Linux container (matches CI)
docker run --rm -v $(pwd):/work -w /work mcr.microsoft.com/playwright:v1.49.0-jammy \
  pnpm exec playwright test e2e/visual.spec.js --update-snapshots
```
