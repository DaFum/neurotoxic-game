# Scenario Tension and Balance Artifact Provenance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Start Scandal Recovery at controversy 50, measure one non-production Chaos Tour event-loss candidate, and migrate every balance artifact to validated content-fingerprint provenance.

**Architecture:** Extend `scripts/utils/balance-report-metadata.mjs` into the shared provenance boundary. Each generator supplies its own path, seed namespace, and run count; the shared helper computes source/generator fingerprints and validates the six-field contract. Scenario changes remain in the simulation harness, while the tension report owns the isolated Chaos comparison and its diagnostic verdict.

**Tech Stack:** Node.js 22, ESM, `node:crypto`, `node:test`, `tsx`, pnpm.

---

### Task 1: Pin the scenario and candidate contracts

**Files:**

- Modify: `tests/node/game-balance-simulation.test.js`
- Modify: `tests/node/game-balance-tension-report.test.js`
- Modify: `scripts/game-balance-simulation.mjs`
- Modify: `scripts/game-balance-tension-report.mjs`

- [ ] **Step 1: Write the failing Scandal Recovery test**

Assert that the `SCENARIOS` entry has `initialOverrides.social.controversyLevel === 50`, its description names an existing public backlash, and unrelated Bootstrap/Festival economy inputs retain their current snapshots.

- [ ] **Step 2: Write the failing Chaos candidate test**

Assert an exported frozen candidate contract equivalent to:

```js
{
  id: 'negative-financial-events-1.25',
  scenarioId: 'chaos_tour',
  negativeFinancialEventMultiplier: 1.25,
  productionChange: false
}
```

Also assert that the candidate changes only negative money deltas produced by event calls, leaving positive deltas and non-event costs unchanged.

- [ ] **Step 3: Run the two affected tests and verify RED**

Run:

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/game-balance-simulation.test.js \
  tests/node/game-balance-tension-report.test.js
```

Expected: FAIL because Scandal still starts at zero and the Chaos candidate contract/scaling does not exist.

- [ ] **Step 4: Implement the minimal scenario changes**

Set Scandal Recovery controversy to 50 and rewrite only its description. Add a scenario-only multiplier boundary around negative event money deltas so the tension report can run control and candidate cohorts without altering production modules or event frequency.

- [ ] **Step 5: Add the single Chaos comparison**

Run matched control/candidate cohorts for `chaos_tour` using one declared seed namespace. Publish bankruptcy, pre-first-gig bankruptcy, finale completion, paired Fame-per-gig delta, and negative-event loss attribution; keep `productionChange: false` regardless of result.

- [ ] **Step 6: Re-run the two tests and verify GREEN**

Run the command from Step 3. Expected: PASS.

### Task 2: Create the shared fingerprint provenance contract

**Files:**

- Modify: `scripts/utils/balance-report-metadata.mjs`
- Modify: `tests/node/balanceSourceFiles.test.js`

- [ ] **Step 1: Write failing metadata tests**

Cover `ARTIFACT_SCHEMA_VERSION`, deterministic path-and-content hashing, generator hashing, all six required metadata fields, dirty-tree diagnostics, and validation failures for missing fields or changed source/generator content.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/balanceSourceFiles.test.js
```

Expected: FAIL because the shared builder and validator are absent.

- [ ] **Step 3: Implement the shared helpers**

Add a single metadata builder accepting `{ root, generatorPath, seedNamespace, runsPerScenario }` and returning exactly:

```js
{
  sourceFingerprint,
  generatorFingerprint,
  seedNamespace,
  runsPerScenario,
  workingTreeDirty,
  artifactSchemaVersion
}
```

Add an async validator that checks the schema/types and recomputes both fingerprints. Preserve sorted relative-path hashing and the existing report-output exclusion in dirty-state detection.

- [ ] **Step 4: Re-run the focused test and verify GREEN**

Run the command from Step 2. Expected: PASS.

### Task 3: Migrate all balance generators and Markdown output

**Files:**

- Modify: `scripts/game-balance-simulation.mjs`
- Modify: `scripts/game-balance-experiments.mjs`
- Modify: `scripts/game-balance-cadence-probe.mjs`
- Modify: `scripts/game-balance-tension-report.mjs`
- Modify: `tests/node/game-balance-simulation.test.js`
- Modify: `tests/node/game-balance-experiments.test.js`
- Modify: `tests/node/game-balance-cadence-probe.test.js`
- Modify: `tests/node/game-balance-tension-report.test.js`

- [ ] **Step 1: Write failing generator-contract tests**

For each generator, assert the exact six-field provenance contract and absence of `sourceBaseCommit`, `balanceSourceSha256`, and generator-specific script-hash fields. Update previous-report identity comparisons to use `sourceFingerprint`.

- [ ] **Step 2: Run all four affected generator tests and verify RED**

Run:

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/game-balance-simulation.test.js \
  tests/node/game-balance-experiments.test.js \
  tests/node/game-balance-cadence-probe.test.js \
  tests/node/game-balance-tension-report.test.js
```

Expected: FAIL on legacy commit/hash metadata.

- [ ] **Step 3: Migrate generator metadata**

Replace local Git/hash construction with the shared async builder. Move `runsPerScenario` into metadata while retaining domain contracts where consumers require them. Make tension provenance validation async and content-based.

- [ ] **Step 4: Migrate human-readable reports**

Replace commit and legacy hash labels with source fingerprint, generator fingerprint, schema version, seed namespace, run count, and dirty state. Do not change balance conclusions unrelated to this request.

- [ ] **Step 5: Re-run the four tests and verify GREEN**

Run the command from Step 2. Expected: PASS.

### Task 4: Regenerate and validate affected artifacts

**Files:**

- Modify: `reports/game-balance-simulation-results.json`
- Modify: `reports/game-balance-simulation-analysis.md`
- Modify: `reports/game-balance-experiments-results.json`
- Modify: `reports/game-balance-experiments-analysis.md`
- Modify: `reports/game-balance-cadence-probe-results.json`
- Modify: `reports/game-balance-cadence-probe-analysis.md`
- Modify: `reports/scenario-tension-attribution.json`
- Modify: `reports/scenario-tension-attribution.md`

- [ ] **Step 1: Run only the requested generators**

Use the existing pnpm scripts with their predeclared 2,000-run settings. Do not run a broad candidate search beyond existing required report generation; the tension generator evaluates only the declared Chaos `1.25` comparison.

- [ ] **Step 2: Validate the regenerated metadata**

Run `pnpm run validate:balance:tension-report` and focused artifact assertions. Confirm every JSON artifact contains the six fields and no `sourceBaseCommit`.

- [ ] **Step 3: Check acceptance evidence**

Record the actual Scandal confirmation and Chaos diagnostic values. Do not alter other economy inputs if a target misses; report the measured result.

### Task 5: Focused final verification and delivery

**Files:** all files above.

- [ ] **Step 1: Run focused tests only**

Run the five affected node test files together. Do not run the full suite, lint-all, or build; CI owns the full gate per user instruction.

- [ ] **Step 2: Run static checks scoped to changed files**

Run `git diff --check`, ESLint on changed JavaScript/MJS files, and `pnpm run symbols:check` only if exported `src/` symbols changed.

- [ ] **Step 3: Inspect the final diff and durable instructions**

Confirm no global economy values changed, the Chaos multiplier is diagnostic-only, and no new non-obvious durable repository rule requires an `AGENTS.md` update.

- [ ] **Step 4: Commit and create the pull request**

Use Conventional Commit message:

```text
feat(balance): validate fingerprinted tension artifacts
```

After the commit, call `make_pr` with a title and body that describe the scenario change, diagnostic-only Chaos candidate, provenance migration, measured results, and focused test commands.
