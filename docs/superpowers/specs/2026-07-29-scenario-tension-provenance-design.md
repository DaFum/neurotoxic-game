# Scenario Tension and Balance Artifact Provenance Design

## Goal

Make Scandal Recovery represent an existing public backlash, measure one isolated
Chaos Tour loss-severity candidate, and replace commit-based provenance across all
balance artifacts with content fingerprints that work in Codex Cloud.

## Scope

This change covers the simulation, experiment, cadence, and scenario-tension
artifact generators. Bootstrap Struggle, Festival Push, global income, starting
capital, obligations, catalogue prices, HQ costs, van prices, module prices, and
gig payouts remain unchanged.

## Scenario changes

### Scandal Recovery

The canonical `scandal_recovery` scenario starts with
`social.controversyLevel: 50`. Its description states that the tour begins amid
an existing public backlash. No other scenario or economy value changes.

If the playable game already has a start profile that semantically represents
the same Scandal Recovery premise, that existing profile receives the same
controversy value. The change does not create a new playable profile.

The final confirmation evaluates the configured scenario without launching a
new candidate search. Its acceptance targets are:

- bankruptcy: 8-12%;
- finale completion: at least 85%;
- bankruptcy before the first gig: at most 1%;
- no additional travel blocks; and
- no global economy effect.

### Chaos Tour

The harness evaluates exactly one diagnostic candidate: negative financial event
consequences multiplied by `1.25`. Event frequency, travel costs, daily costs,
and all other economy inputs remain unchanged. The multiplier exists only in the
simulation/report path and is not applied to production gameplay.

The comparison reports whether the candidate moves material loss attribution
toward negative events. Its acceptance targets are:

- total bankruptcy: 4-7%;
- bankruptcy before the first gig: at most 1%;
- finale completion: at least 90%;
- paired Fame per gig: within +/-5%; and
- negative events visible as a material loss source.

The harness does not search other multipliers and does not evaluate `1.50` in
this change. Passing the diagnostic does not promote the candidate to production.

## Shared artifact provenance

All balance artifacts use one required metadata contract:

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

- `sourceFingerprint` is a deterministic SHA-256 over sorted repository-relative
  paths and file contents for all canonical balance sources. The existing
  `BALANCE_SOURCE_FILES` inventory remains the base source-of-truth, with
  generator-specific source inputs included where required.
- `generatorFingerprint` is the SHA-256 of the generator that writes the
  artifact.
- `seedNamespace` is the namespace actually used for that artifact.
- `runsPerScenario` is the number of runs actually executed per scenario.
- `workingTreeDirty` records generation-time worktree state for diagnosis. It is
  not itself a validation failure.
- `artifactSchemaVersion` is the shared numeric version of this metadata contract.

`sourceBaseCommit` and commit-based provenance validation are removed completely.
Redundant source and generator hash fields are removed when the two fingerprints
replace them.

## Validation

The shared validator checks that all six fields exist and have the expected
types. It recomputes the source and generator fingerprints from the current
checkout and compares them with the artifact. It also checks the schema version,
seed namespace, and run count against the generator's report contract.

Validation does not call `git cat-file`, inspect ancestry, require a reports-only
diff, or reject a dirty tree merely for being dirty. A dirty checkout validates
when the current relevant file contents match the stored fingerprints.

## Testing and artifact generation

Development follows test-first red/green cycles for:

- Scandal Recovery's controversy level and backlash description;
- the single non-production Chaos Tour `1.25` candidate;
- required metadata and stable content hashing;
- source and generator mismatch detection without commit dependence;
- simulation, experiment, cadence, and tension artifact contracts; and
- the canonical balance source inventory.

Only affected tests run locally. The full suite remains a CI responsibility.
After the focused tests pass, affected artifacts are regenerated with the new
schema. The Scandal confirmation and the single Chaos comparison run without a
broad candidate search.

## Non-goals

- Shipping a Chaos loss multiplier to production.
- Evaluating a `1.50` Chaos candidate.
- Retuning Bootstrap Struggle or Festival Push.
- Changing global economy inputs or progression prices.
- Measuring or changing module amortization in Phase 7.
