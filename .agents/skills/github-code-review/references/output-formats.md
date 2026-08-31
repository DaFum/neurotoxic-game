# Output Formats and Templates

Reference this file when composing inline comments and summary reviews.

## Inline Comment Template

Post an inline comment for every Important or Critical finding. Inline comments appear directly on
the changed line and are the most actionable part of a review.

```markdown
**[Issue title]**

[One sentence: what is wrong here.]

[One sentence: why it matters — data corruption, security risk, test failure, etc.]

**Fix:** [Concrete suggestion, ideally a one-line diff or function name to use instead.]
```

### Example — type guard violation

```markdown
**Number() coercion on persisted value**

`Number(state.streak)` silently accepts booleans, strings, and arrays from persisted state.

This can corrupt the game state if a save file contains an unexpected type for this field.

**Fix:** Replace with `isFiniteNumber(state.streak)` — it returns `false` for all non-finite and
non-number values. Import from `src/utils/finiteNumber.ts`.
```

### Example — missing finiteNumberOr

```markdown
**Missing finiteNumberOr before clamp**

`state.coins + payload.amount` will produce `NaN` if `state.coins` was persisted as
`NaN` or `Infinity` (which both pass `typeof === 'number'`).

**Fix:** `finiteNumberOr(state.coins, 0) + finiteNumberOr(payload.amount, 0)` before the
`Math.max(0, ...)` clamp. Import `finiteNumberOr` from `src/utils/finiteNumber.ts`.
```

---

## Top-Level Summary Template

Post one top-level comment after all inline comments are done.

```markdown
## Code Review

### Summary
[1–3 sentences describing what the PR does and your overall read on code quality.]
[If the PR is a draft, start with "Draft —".]

### Critical
- **[Short title]** — `path/to/file.ts:line` — [what's wrong and why it matters]

### Important
- **[Short title]** — `path/to/file.ts:line` — [what's wrong and why it matters]

### Minor
- **[Short title]** — `path/to/file.ts:line` — [brief note; fix is obvious or low-risk]

### Verdict
**[Approve / Request changes / Comment]** — [one sentence rationale]
```

**Rules:**
- Omit any severity section with zero findings
- Every bullet must include `file:line` — never a vague module reference
- **Approve** = no findings, or only Minors the author can address at their discretion
- **Request changes** = one or more Critical or Important findings that must be fixed before merge
- **Comment** = findings worth noting but none block merge (use sparingly; prefer Approve + Minors)

---

## Verdict Decision Tree

```
Are there any Critical findings?
├── YES → Request changes
└── NO
    Are there any Important findings?
    ├── YES → Request changes
    │         (note in the verdict if they are quick fixes)
    └── NO
        Are there Minor findings worth noting?
        ├── YES → Approve  (list minors; author can address or ignore)
        └── NO  → Approve  (state you reviewed and found nothing)
```

Use **Comment** only when you want to flag something for awareness without blocking merge — for
example, a design concern that is out of scope for this PR but worth a follow-up discussion.

---

## Tone Guide

| Situation | Write this | Avoid |
|-----------|-----------|-------|
| Identifying a bug | "This will corrupt state if `streak` is `NaN`." | "You might want to consider..." |
| Suggesting a fix | "Use `isFiniteNumber(val)` — it rejects NaN and booleans." | "Maybe use a different check?" |
| Clean code | "Logic is sound; follows action-creator → reducer flow." | "Looks good!" (no evidence) |
| Uncertain finding | "I can't verify this without running the code — worth checking manually." | Flagging it as Important anyway |
| Low-priority item | List under Minor or omit | Flagging import order as Important |

---

## Full Example — PR with mixed findings

```markdown
## Code Review

### Summary
Adds a daily obligation tracker used in the bankruptcy check. The core logic is correct and
follows the action-creator → reducer pattern. Two issues to fix before merge.

### Critical
- **Direct state mutation in tick** — `src/context/reducers/assetReducer.ts:203` —
  `state.liabilities[id].balance -= daily` mutates state directly instead of returning a new
  object. This breaks React's change detection and will cause the UI to not update.

### Important
- **Number() coercion on liability balance** — `src/context/reducers/assetReducer.ts:198` —
  `Number(liability.balance)` accepts strings from persisted saves. Use
  `finiteNumberOr(liability.balance, 0)`.

### Minor
- **Missing German locale key** — `public/locales/en/economy.json:44` — Added
  `bankruptcy.daily_obligations` but `public/locales/de/economy.json` has no matching key.
  Will fall back to English.

### Verdict
**Request changes** — Fix the direct mutation (Critical) and the type coercion (Important)
before merge. The locale key can follow in a separate PR if needed.
```

---

## Full Example — Clean PR

```markdown
## Code Review

### Summary
Replaces three direct `player.location` reads in venue selectors with
`getRegionKeyForLocation(player.location)`, consistent with the architecture constraint in
AGENTS.md. No logic changes; all existing tests pass.

### Verdict
**Approve** — Correct usage throughout, no regressions.
```
