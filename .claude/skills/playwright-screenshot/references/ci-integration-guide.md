# CI/CD Integration Guide for playwright-screenshot

This guide shows how to integrate screenshot testing into your CI pipeline (GitHub Actions, GitLab CI, etc.).

## GitHub Actions Workflow Example

```yaml
name: Visual Regression Tests

on:
  pull_request:
    paths:
      - 'src/**'
      - 'e2e/**'
      - '.github/workflows/screenshots.yml'

jobs:
  screenshots:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22.13'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build project
        run: pnpm run build

      - name: Start dev server in background
        run: pnpm run dev &
        env:
          VITE_ENV: test

      - name: Wait for dev server
        run: |
          for i in {1..30}; do
            curl -s http://localhost:5173 && exit 0
            sleep 1
          done
          exit 1

      - name: Capture game flow screenshots
        run: |
          node .claude/skills/playwright-screenshot/scripts/screenshot-game-flow.js
        env:
          BASE_URL: http://localhost:5173
          OUT_DIR: screenshots/ci-run
          HEADLESS: true

      - name: Compare with baseline
        run: |
          node .claude/skills/playwright-screenshot/scripts/diff-screenshots.js \
            screenshots/baselines/ \
            screenshots/ci-run/
        continue-on-error: true

      - name: Upload screenshots on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: screenshots-${{ github.run_number }}
          path: screenshots/ci-run/
          retention-days: 7

      - name: Run Playwright visual tests
        run: pnpm exec playwright test e2e/visual.spec.js

      - name: Update baseline (on manual trigger)
        if: github.event_name == 'workflow_dispatch' && inputs.update_baseline
        run: |
          cp -r screenshots/ci-run/* screenshots/baselines/
          git add screenshots/baselines/
          git commit -m "chore: update screenshot baselines"
          git push
```

## Pre-Flight Checks

Before running in CI, verify locally:

```bash
# 1. Check dev server starts
pnpm run dev &
curl -s http://localhost:5173

# 2. Run screenshot capture
node .claude/skills/playwright-screenshot/scripts/screenshot-game-flow.js

# 3. Verify all fixtures inject correctly
node .claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js menu
node .claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js pregig
node .claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js gameover

# 4. Run Playwright tests
pnpm exec playwright test
```

## Environment Variables for CI

| Variable                           | Default                 | Purpose                                      |
| ---------------------------------- | ----------------------- | -------------------------------------------- |
| `BASE_URL`                         | `http://localhost:5173` | Dev server URL                               |
| `OUT_DIR`                          | `screenshots/scenes`    | Output directory for captures                |
| `HEADLESS`                         | `true`                  | Run headless (always true in CI)             |
| `SLOWMO`                           | `0`                     | Slow-motion for debugging (leave at 0 in CI) |
| `BROWSER_PATH`                     | (auto-detect)           | Path to Chrome/Chromium binary               |
| `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` | (unset)                 | Set to 1 if providing cached browser         |

## Handling Browser Installation

### Option 1: Let Playwright Download (Requires Network)

```yaml
- name: Capture screenshots
  run: node .claude/skills/playwright-screenshot/scripts/screenshot-game-flow.js
```

Playwright will download browser on first run (if CDN accessible).

### Option 2: Use Cached Browser (Recommended for Air-Gap)

```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-v1

- name: Capture screenshots (with cache)
  run: node .claude/skills/playwright-screenshot/scripts/screenshot-game-flow.js
```

### Option 3: Provide Custom Browser Path

```yaml
- name: Find system Chrome
  id: chrome
  run: |
    CHROME_PATH=$(which chromium-browser || which google-chrome || which chrome)
    echo "path=$CHROME_PATH" >> $GITHUB_OUTPUT

- name: Capture screenshots (system Chrome)
  run: node .claude/skills/playwright-screenshot/scripts/screenshot-game-flow.js
  env:
    BROWSER_PATH: ${{ steps.chrome.outputs.path }}
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1'
```

## Visual Regression Testing

### Setup Baseline

On your main branch, run and commit baseline screenshots:

```bash
node .claude/skills/playwright-screenshot/scripts/screenshot-game-flow.js
mkdir -p screenshots/baselines
cp screenshots/scenes/* screenshots/baselines/
git add screenshots/baselines/
git commit -m "feat: add screenshot baselines"
```

### In CI, Compare Against Baseline

```bash
# Capture current
node .claude/skills/playwright-screenshot/scripts/screenshot-game-flow.js

# Generate diff report
node .claude/skills/playwright-screenshot/scripts/diff-screenshots.js \
  screenshots/baselines/ \
  screenshots/scenes/ > diff-report.txt

# Fail if significant differences
if [ -s diff-report.txt ]; then
  echo "Visual regressions detected:"
  cat diff-report.txt
  exit 1
fi
```

## Handling Flaky Tests

### Increase Timeouts

```bash
# In screenshot-game-flow.js, increase delays:
# snap(page, name, delay = 1000)  # was 500-1500ms
```

### Add Retry Logic

```yaml
- name: Capture screenshots (with retry)
  uses: nick-invision/retry@v3
  with:
    timeout_minutes: 5
    max_attempts: 3
    command: |
      node .claude/skills/playwright-screenshot/scripts/screenshot-game-flow.js
```

### Debug Failures

```yaml
- name: Debug screenshot failure
  if: failure()
  run: |
    # Run with slowmo for visibility
    SLOWMO=100 HEADLESS=false node .claude/skills/playwright-screenshot/scripts/screenshot-game-flow.js

    # Check dev server
    curl -v http://localhost:5173
```

## Best Practices

1. **Run on schedule** — Daily/weekly baseline captures to detect environmental issues early
2. **Artifact retention** — Keep failed screenshots for 7 days (for debugging)
3. **Fail fast** — If browser launch fails, don't waste CI minutes
4. **Cache everything** — node_modules, Playwright browsers, build outputs
5. **Parallel fixtures** — Run different scenes in parallel jobs if capturing many

## Example: Parallel Scene Capture

```yaml
strategy:
  matrix:
    scene: [menu, overworld, pregig, gig, postgig, gameover, clinic]

steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
  - run: pnpm install

  - name: Capture ${{ matrix.scene }}
    run: |
      node .claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js ${{ matrix.scene }}
    env:
      OUT_DIR: screenshots/${{ matrix.scene }}

  - name: Upload artifact
    uses: actions/upload-artifact@v4
    with:
      name: screenshot-${{ matrix.scene }}
      path: screenshots/${{ matrix.scene }}/
```

## Troubleshooting CI Failures

### "Browser executable doesn't exist"

**Cause:** CDN unreachable, no cached browser, no BROWSER_PATH

**Solution:**

```bash
# Pre-populate browser cache
pnpm install  # Downloads Playwright browsers locally
tar -czf playwright-cache.tar.gz ~/.cache/ms-playwright
# Commit to repo or upload to artifact storage
```

### "Timeout 30000ms exceeded"

**Cause:** Network lag, font loading, animation timeouts

**Solution:**

```yaml
- name: Increase screenshot timeout
  run: |
    # In screenshot-game-flow.js, change:
    # await page.screenshot({ path: file, timeout: 60000 })
  env:
    PLAYWRIGHT_TIMEOUT: 60000
```

### "Cannot connect to localhost:5173"

**Cause:** Dev server failed to start, port conflict

**Solution:**

```bash
# Check server startup
pnpm run dev 2>&1 | tee dev-server.log &
sleep 5
curl -v http://localhost:5173

# If failed, check logs
tail -50 dev-server.log
```

## Monitoring & Alerts

Set up monitoring for screenshot test health:

```yaml
- name: Monitor screenshot health
  if: always()
  run: |
    PASSED=$(ls screenshots/scenes/*.png 2>/dev/null | wc -l)
    EXPECTED=16  # Update with actual scene count

    if [ $PASSED -lt $EXPECTED ]; then
      echo "::warning::Only $PASSED/$EXPECTED scenes captured"
    fi
```

## Local Reproduction

To reproduce CI failures locally:

```bash
# Simulate CI environment
export HEADLESS=true
export BASE_URL=http://localhost:5173
export OUT_DIR=screenshots/ci-repro

# Start dev server
pnpm run dev &
sleep 3

# Run exact same command as CI
node .claude/skills/playwright-screenshot/scripts/screenshot-game-flow.js

# Check output
ls -lah screenshots/ci-repro/
```

## Success Metrics

A successful screenshot CI pipeline should:

- ✅ Capture 12+ scenes in < 2 minutes
- ✅ Identify visual regressions (new differences > threshold)
- ✅ Artifact retention for debugging
- ✅ Baseline updates on manual approval
- ✅ Quick failure diagnosis (browser launch, server, timeout, etc.)
