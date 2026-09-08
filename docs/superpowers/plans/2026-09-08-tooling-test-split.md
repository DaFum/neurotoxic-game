# Tooling Test Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove tests whose primary subject is repository tooling from production-oriented test commands and expose them through `pnpm run test:tooling`.

**Architecture:** Keep test files in place and classify the Node-owned tooling suites with one exported path list shared by the runner and its discovery tests. Add `--only-tooling` to the Node runner, exclude the one Vitest-owned tooling suite from logic discovery, and compose both engines in the package script.

**Tech Stack:** Node.js 22 `node:test`, Vitest, ECMAScript modules, pnpm.

---

### Task 1: Pin the tooling boundary with failing tests

**Files:**

- Modify: `tests/node/nodeTestDiscovery.test.js`
- Modify: `vitest.config.node.js`

- [x] **Step 1: Add assertions for the explicit Node tooling set**

Import `TOOLING_NODE_TESTS` beside the existing discovery constants. Assert that every listed path exists, is unique, belongs to a Node-owned directory, and is absent from normal automatic selection while present in tooling-only selection.

- [x] **Step 2: Exclude the Vitest tooling suite from normal logic discovery**

Add `tests/utils/scenario-seeds.test.js` to `vitest.config.node.js`'s `exclude` list while preserving the existing DOM-specific exclusion.

- [x] **Step 3: Run the focused test and confirm the missing export fails**

Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/nodeTestDiscovery.test.js`

Expected: FAIL because `TOOLING_NODE_TESTS` is not exported yet.

### Task 2: Implement Node tooling selection

**Files:**

- Modify: `scripts/utils/node-test-dirs.mjs`
- Modify: `scripts/run-node-tests.mjs`

- [x] **Step 1: Define the explicit Node tooling paths**

Export a frozen `TOOLING_NODE_TESTS` array from `scripts/utils/node-test-dirs.mjs`. Include the Agent/skill sync, discovery/parallelism, symbol, Vite/PWA, Playwright fixture, balance metadata, balance simulation and Expedition balance harness suites identified in the approved design.

- [x] **Step 2: Add the tooling-only runner mode**

Parse `--only-tooling`, remove it from forwarded Node arguments, reject combinations with `--skip-heavy` or `--only-heavy`, and make automatic discovery select only the tooling set in this mode. In every normal automatic mode, filter the tooling set out before heavy filtering and sharding. Preserve direct-file behavior.

- [x] **Step 3: Run the focused discovery test**

Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/nodeTestDiscovery.test.js`

Expected: PASS.

### Task 3: Expose and verify the separate command

**Files:**

- Modify: `package.json`
- Create: `vitest.config.tooling.js`

- [x] **Step 1: Add the package command**

Add a focused Node-environment Vitest config for `scenario-seeds.test.js`, then add `test:tooling` as a sequential composition of `node ./scripts/run-node-tests.mjs --only-tooling` and that focused Vitest configuration.

- [x] **Step 2: Verify the separate Tooling run**

Run: `pnpm run test:tooling`

Expected: PASS with the classified Node suites and `scenario-seeds.test.js`.

- [x] **Step 3: Verify the production-oriented fast run**

Run: `pnpm run test`

Expected: PASS without executing any classified tooling suite.

- [x] **Step 4: Run the repository quality gate**

Run: `.agents/skills/one-command-quality-gate/scripts/quality-gate.sh`

Expected: lint, production-oriented tests, and build all PASS.

- [x] **Step 5: Review and commit**

Run `git diff --check`, inspect `git diff`, then commit with:

```text
test(tooling): split infrastructure tests from production suite
```
