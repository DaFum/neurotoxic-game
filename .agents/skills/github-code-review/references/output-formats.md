# Output Formats and Templates

Load this file only after substantive review is complete. Its job is to turn confirmed evidence into
the smallest useful set of GitHub comments and a verdict that matches both risk and review coverage.

## Inline Comment Template

Post an inline comment for each confirmed **Critical** or **Important** finding. Do not create inline
comments for contingent concerns or duplicate observations sharing one root cause.

```markdown
**[Issue title]**

[What is wrong on this changed line/hunk.]

[Concrete failure mode: what breaks, corrupts, leaks, crashes, misroutes, or becomes unsound and on what realistic path.]

**Fix:** [Smallest safe correction that preserves the author's intent.]

[Test, when high-value: one focused regression test that would fail on this bug.]
```

### Comment rules

- Lead with the concrete defect, not a generic best practice.
- Use direct language for confirmed behavior.
- Use conditional language only when the underlying concern is explicitly contingent.
- Never invent line numbers, tests, callers, or runtime behavior.
- Prefer a local safe fix over a broad rewrite.
- When several hunks share one root cause and fix, comment once on the best line and mention the other affected sites in that comment.
- Do not post a separate "missing test" comment when the test gap merely repeats the implementation defect and does not represent a distinct risk.

### Example — strict boundary failure

```markdown
**Persisted value is trusted through coercion**

`Number(state.streak)` accepts numeric strings, booleans, and arrays from persisted data instead of rejecting the malformed type.

That lets invalid save data cross the load/state boundary as a seemingly valid number and can change gameplay state instead of falling back or dropping the field.

**Fix:** Validate the raw value with the repo's strict finite-number guard before using it; keep the reducer-side clamp as defense in depth.

**Test:** Load a save with `streak: "5"` and assert that the invalid field is rejected/falls back rather than becoming `5`.
```

---

## Top-Level Summary Template

Post one concise top-level summary after inline comments.

```markdown
## Code Review

### Summary
[1–3 sentences: PR intent, overall technical read, and draft note if applicable.]

### Critical
- **[Short title]** — `path/to/file.ts:line` — [failure mode and required fix direction]

### Important
- **[Short title]** — `path/to/file.ts:line` — [failure mode and required fix direction]

### Minor
- **[Short title]** — `path/to/file.ts:line` — [brief non-blocking repo-rule issue]

### Coverage
[Include only for partial/large reviews: fully reviewed / spot-checked / not reviewed by area.]

### Limitations
[Include only when unresolved evidence gaps materially constrain the conclusion. Do not disguise contingent concerns as findings.]

### Verdict
**[Approve / Request changes / Comment]** — [one sentence tied to the strongest unresolved finding and coverage.]
```

### Summary rules

- Omit empty severity, coverage, and limitation sections.
- Every listed finding includes a concrete `file:line` when the review system exposes one.
- Summaries should not repeat full inline comments; compress to the root cause and consequence.
- Mention an existing unresolved review thread instead of creating a duplicate finding when appropriate.
- Do not say tests pass unless the evidence actually shows they were run successfully.

---

## Verdict Decision Tree

Apply coverage before issue severity:

```text
Was every changed file fully reviewed?
├── NO
│   ├── Any Critical or Important finding? -> Request changes
│   └── No blocking finding              -> Comment (state coverage gap)
└── YES
    ├── Any Critical finding?             -> Request changes
    ├── Any Important finding?            -> Request changes
    ├── Only Minor findings?              -> Approve (list minors as optional)
    └── No findings                       -> Approve
```

Use **Comment** for a clean but intentionally partial review or for useful non-blocking context that cannot justify approval. Do not use Comment to soften a confirmed Important/Critical defect.

---

## Severity and Confidence Alignment

Severity describes the **confirmed defect consequence**, not how risky the file looked during triage.

- **Critical:** confirmed data/state corruption, exploit/security issue, direct mutation or broken state transition, lost progress, or clearly broken functionality on a realistic path.
- **Important:** confirmed logic/type/boundary error that should be fixed before merge and has a concrete realistic failure mode.
- **Minor:** real low-impact repository-rule or consistency issue that does not materially undermine merge safety.

Confidence controls whether a concern appears as a finding at all:

- **Confirmed:** may appear as Critical/Important/Minor.
- **Contingent:** fetch more evidence; if still uncertain, mention only as a limitation/follow-up when useful.
- **Unsupported:** omit.

When severity is ambiguous, choose the lower severity unless a persistence, security, trust-boundary, or state-corruption path clearly justifies escalation.

---

## Tone Guide

| Situation | Write this | Avoid |
|-----------|------------|-------|
| Confirmed defect | "This allows a stale replay to charge the player a second time." | "This might possibly be risky." |
| Concrete fix | "Return the original state when the slot is already occupied." | "Consider refactoring this area." |
| Boundary issue | "Validate the parsed value before casting/using it." | "TypeScript could be stronger here." |
| Contingent concern | "I can't confirm this without the caller that supplies `id`; I left it out of the blocking findings." | Flagging it as Important anyway |
| Clean code | "The changed path preserves the action-creator -> reducer contract and no-op identity." | "Looks good!" with no evidence |
| Low-priority style | Omit, unless an explicit repo rule is broken | Turning taste into a Minor/Important finding |

---

## Full Example — Mixed Findings

```markdown
## Code Review

### Summary
Adds a daily obligation tracker used by the bankruptcy path. The main flow is aligned with the asset architecture, but two confirmed state-safety issues block merge.

### Critical
- **Direct state mutation in tick** — `src/context/reducers/assetReducer.ts:203` — mutates a persisted liability in place, breaking reducer identity guarantees and allowing state updates to bypass the normal immutable transition contract.

### Important
- **Unsafe persisted-number arithmetic** — `src/context/reducers/assetReducer.ts:198` — uses the stored balance without `finiteNumberOr`, so a corrupted non-finite save value can poison the computed balance.

### Minor
- **Missing German locale key** — `public/locales/en/economy.json:44` — the matching German key is absent, so this copy can fall back unexpectedly.

### Verdict
**Request changes** — Fix the mutation and persisted-number handling before merge; the locale mismatch is non-blocking.
```

---

## Full Example — Clean Full Review

```markdown
## Code Review

### Summary
Replaces direct location reads with `getRegionKeyForLocation(player.location)` in the changed selectors. I reviewed all changed files and the new path preserves the existing region-key contract.

### Verdict
**Approve** — No Critical, Important, or actionable Minor findings in the fully reviewed diff.
```

---

## Full Example — Clean Partial Review

```markdown
## Code Review

### Summary
The reducer/action/persistence paths I reviewed are internally consistent and I found no blocking defect.

### Coverage
- State/reducer paths: fully reviewed
- UI/locale/test-only changes: spot-checked

### Verdict
**Comment** — No blocking finding in the reviewed areas, but coverage was partial so this is not an approval.
```
