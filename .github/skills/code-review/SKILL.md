---
name: code-review
description: >
  Perform a thorough code review on a GitHub pull request using the GitHub MCP tools. Trigger when
  asked to review a PR, review a pull request, check a PR, look at someone's changes, give feedback
  on a PR, or assess whether changes are ready to merge. Also trigger when given a PR number, PR
  URL, or branch name and asked for any kind of feedback, review, quality check, or assessment.
  Trigger on phrases like "look at PR #N", "what do you think of these changes", "is this ready to
  merge", "check my branch", "review this diff", or "can you give feedback on #N".
---

# GitHub Code Review

Review a pull request and post clear, evidence-backed feedback using the GitHub MCP tools. Lead
with inline comments on the specific lines that need changing — they are far more actionable than a
summary — then close with a top-level verdict comment.

**Core principle:** Report only high-confidence findings. Every finding cites a specific file:line.
Never flag style preferences unless an explicit repo rule is being broken.

## Before Starting

You need `owner`, `repo`, and the pull request number.

- If running as Copilot code review, these are already in context — proceed immediately.
- Otherwise, derive `owner`/`repo` from the repository URL or working directory. Ask only if the
  PR number is genuinely missing.

Note if the PR is a draft — mention it once in the summary, but still complete the review.

## Workflow

### 1. Fetch context (run all three in parallel)

```
pull_request_read  method=get              → title, description, author, base/head, draft status
pull_request_read  method=get_commits      → commit messages (read intent before reading code)
pull_request_read  method=get_review_comments  → open threads (don't re-raise already-flagged issues)
```

If the description is missing or a single line, treat that as a Minor finding — good descriptions
reduce future review time.

### 2. Read the diff

```
pull_request_read  method=get_diff
```

For diffs larger than 500 changed lines, call `method=get_files` first. Focus on:
- Files with new logic (reducers, selectors, action creators, utilities)
- Security-sensitive paths (auth, input parsing, persistence)
- Files where tests were *not* added alongside production changes

Test files alone are low priority unless they contain new shared fixtures or mocks.

For each changed production file, ask:
1. Does this do what the commits/description claim?
2. Any logic errors, off-by-one, or uncovered edge cases?
3. Any security implications (unsanitized input, auth bypass, secret exposure)?
4. Does it break existing contracts (API shape, action payload, state schema)?
5. Is the code covered by new or existing tests that exercise the actual logic?

### 3. Apply Neurotoxic-specific checks

Violations of these conventions are bugs, not preferences:

**Critical (broken functionality / data integrity)**
- Direct state mutation — all updates must flow through typed action creators → reducers.
- `currentGig` used as a location — derive city via `getRegionKeyForLocation`, never `player.location` directly.
- `START_GIG` reducer changing scenes — scene navigation belongs in continuation callbacks, not reducers.

**Important (type-safety / numeric correctness)**
- `Number()` coercion instead of `isFiniteNumber(val)` — `Number()` silently accepts booleans,
  arrays, and numeric strings, corrupting state.
- Missing `finiteNumberOr(value, fallback)` before clamping persisted numbers — `??` and
  `typeof === 'number'` both pass `NaN`/`Infinity`.
- Direct Tone.js time reads for gameplay timing — use `audioEngine.getGigTimeMs()` instead.
- Recursive object utilities missing `WeakSet` cycle guard.

**Minor (convention / completeness)**
- User-facing string added to `public/locales/en/` without a matching key in `public/locales/de/`.
- Hardcoded hex color — use CSS variables (`var(--color-*)`) or `getPixiColorFromToken()`.
- `.propTypes` added to a React component (not used in this codebase).
- Commit message missing Conventional Commits format (`type(scope): message`).

### 4. Post inline comments, then a summary

**Inline first.** For every Important or Critical finding, post an inline comment on the specific
changed line. Each inline comment should state: what the problem is, why it matters, and a concrete
fix. Inline comments are what make the review actionable — the author sees them right where the
change is.

**Then post the top-level summary** using `github-mcp-server-add_issue_comment`:

```markdown
## Code Review

### Summary
[1–3 sentences: what the PR does and your overall read on quality]

### Critical
- **[Short title]** — `path/file.ts:line` — [what's wrong and why it matters]

### Important
- **[Short title]** — `path/file.ts:line` — [what's wrong and why it matters]

### Minor
- **[Short title]** — `path/file.ts:line` — [brief note; fix is straightforward]

### Verdict
**[Approve / Request changes / Comment]** — [one sentence rationale]
```

Omit any severity section with no findings. If the PR is a draft, open the verdict with "Draft —"
and give the same honest assessment anyway.

## What Not to Flag

Skip findings that waste review trust:
- Import ordering or whitespace that linters already enforce
- Refactors that don't change behavior when the result is clearly correct
- Missing JSDoc on private helpers (this codebase doesn't require it)
- Suggestions that are purely stylistic with no correctness or maintainability impact

Flagging these trains the author to ignore your comments.

## Examples

**Finding an issue:**
```
User: Review PR #47

→ method=get: "Add streak bonus to gig score" (not a draft)
→ method=get_commits: "feat(gig): add streak multiplier to completion payout"
→ method=get_review_comments: no open threads
→ method=get_diff: gigReducer.js:84 — bonus = Number(state.streak) * 1.1

→ Inline comment on gigReducer.js:84:
  "Number(state.streak) accepts booleans and strings from persisted state.
   Use isFiniteNumber(state.streak) — it rejects NaN, Infinity, booleans, and strings.
   (AGENTS.md: 'State and payload sanitizers must enforce strict type narrowing.')"

→ Top-level comment:

## Code Review

### Summary
Adds a streak multiplier to gig completion payouts. Structure is clean and follows the
action-creator → reducer flow. One type-safety issue to fix before merge.

### Important
- **Number() coercion on persisted streak** — `src/reducers/gigReducer.js:84` —
  `Number(state.streak)` accepts booleans and strings. Use `isFiniteNumber(state.streak)`.

### Verdict
**Request changes** — Fix the type guard; everything else is solid.
```

**Clean PR:**
```
User: Can you check PR #51?

→ method=get: "Refactor venue selector to use getRegionKeyForLocation" (not draft)
→ method=get_commits: "refactor(selectors): replace raw player.location with getRegionKeyForLocation"
→ method=get_review_comments: no open threads
→ method=get_diff: three selector files updated, raw player.location references replaced throughout,
  existing tests pass unchanged, no new logic added

→ No inline comments needed

## Code Review

### Summary
Replaces raw `player.location` accesses in venue selectors with `getRegionKeyForLocation`,
consistent with the AGENTS.md architecture constraint. No logic changes; existing tests cover
all paths.

### Verdict
**Approve** — Clean refactor, correct usage, no regressions.
```
