# Default Test Suite Audit

Audit date: 2026-07-31

## Scope

The default `pnpm run test` command runs the quick `node:test` tier and the
Vitest logic tier in parallel. The audit engagement started with 483 test
files; after the first chassis consolidation, this deeper pass examined all
480 remaining files and the 230 files owned by the quick Node tier.
Playwright, UI, locale, and performance suites were checked for ownership
overlap but were not treated as part of the default command.

## Changes made

### Repository-wide generators belong in the heavy tier

`updateSymbols.test.js` regenerates the complete repository symbol index in a
suite hook and again in three tests. An isolated run took 65.3 seconds; each of
the three regeneration tests took roughly 16 seconds. The suite remains in
`test:node`, `test:node:heavy`, and `test:all`, but no longer blocks the normal
quick loop.

### Balance diagnostics belong together

The cadence and tension report suites import the balance simulator and report
generators. Isolated runs took 12.6 and 12.1 seconds respectively. They now sit
beside the simulation and experiment suites in the heavy tier. Their contract
coverage is retained; only their default-run ownership changed.

### Unseeded stress loops duplicated deterministic unit coverage

`socialEngine.stress.test.js` ran 30,000 unseeded iterations through
`generatePostOptions`, `resolvePost`, and `calculateDailyUpdates`. Its
assertions duplicated deterministic contracts already covered by
`socialEngine.test.js` and `simulationUtils.test.js`: option cardinality and
shape, numeric result shape, resource clamps, and member-stat bounds. The
randomized file was removed rather than moved because it had no reproducible
failing seed and added no distinct contract.

## Duplicate-code review

`jscpd` reported 114 clone pairs across the Node-owned test directories at an
8-line/60-token threshold. The largest remaining pairs are mock and fixture
setup for audio/Pixi modules. They were not consolidated because Node module
mocks are installed before dynamic imports and the affected files exercise
different modules or lifecycle boundaries; sharing those mocks would increase
cross-test coupling without removing duplicate behavioral assertions.

The repeated chassis contracts were consolidated separately into
`tests/node/chassisConfig.test.js`. No byte-identical test files and no files
owned by more than one normal-suite runner were found.

## Retained candidates

- `auditReportRegression.test.js` uses source-shape assertions, but each check
  protects a current architectural or localization invariant and runs in well
  under one second. It is brittle by design, not obsolete.
- `audioEngineSetup.test.js` and `audioAssets.test.js` contain environment
  guards around experimental Node timer/context mocks. The audited Node 22
  run executed them without skips, so removing their fallback guards was not
  justified by current evidence.
- Large reducer and domain files contain many cases, but their assertions cover
  distinct hostile payloads, transition branches, or persisted-state shapes.
  File length alone was not used as evidence of overtesting.

## Measurement notes

Individual-file timings include TypeScript loader and process startup and are
therefore not additive to the parallel suite wall time. They are suitable for
classifying work as quick versus heavy, not for claiming an exact aggregate
speedup. Compare future changes with the same command, worker settings,
machine, and pass state.
