---
name: github-code-review
description: >
  Perform a thorough code review on a GitHub pull request using the GitHub MCP tools. Trigger when
  asked to review a PR, review a pull request, check a PR, look at someone's changes, give feedback
  on a PR, or assess whether changes are ready to merge. Also trigger when given a PR number, PR
  URL, or branch name and asked for any kind of feedback, review, quality check, or assessment.
  Trigger on phrases like "look at PR #N", "what do you think of these changes", "is this ready to
  merge", "check my branch", "review this diff", or "can you give feedback on #N".
---

# GitHub Code Review

Review a pull request and post clear, evidence-backed feedback using the GitHub MCP tools. Post
inline comments on specific changed lines where possible — they're far more actionable than a wall
of text — and finish with a top-level summary.

**Core principle:** Only report high-confidence issues. Every finding must cite a specific
file:line. Don't flag style preferences unless the codebase has an explicit rule being broken.

## Before Starting

You need the repository `owner`, `repo`, and pull request number. If any of these are missing from
the user's message, extract `owner` and `repo` from the repository URL or working directory, then
ask for the PR number if still unknown.

## Workflow

### 1. Gather PR context

Call `pull_request_read` with:
- `method: get` → title, description, author, base/head branches
- `method: get_commits` → commit messages (understand intent before reading code)
- `method: get_review_comments` → existing review threads (avoid duplicating open issues)

### 2. Read the diff

Call `pull_request_read` with `method: get_diff`.

If the diff is very large (>500 changed lines), call `method: get_files` first to see all changed
files, then prioritize the highest-risk ones (new logic, security-sensitive paths, state changes).

Work through the diff methodically. For each changed file, ask:

- Does this change do what the description/commits claim?
- Are there logic errors, off-by-one mistakes, or missing edge cases?
- Are there security implications (unsanitized input, auth bypass, secret exposure)?
- Does the change break existing contracts (API shape, event payloads, state schema)?
- Are new tests present and meaningful (testing logic, not just scaffolding)?

### 3. Neurotoxic-specific checks

This repository has strict conventions — violations here are Important or Critical findings:

| Rule | What to look for |
|------|-----------------|
| State mutations | All updates must go through typed action creators → reducers. Direct state mutation = Critical. |
| Persisted arithmetic | `finiteNumberOr(value, fallback)` required before clamping stored numbers. Using `??` or `typeof` instead = Important. |
| Type guards | `isFiniteNumber(val)` required — `Number()` coercion (accepts booleans/arrays/strings) = Important. |
| i18n keys | User-facing strings need matching keys in both `public/locales/en/` and `public/locales/de/`. Missing German key = Minor. |
| Game timing | `audioEngine.getGigTimeMs()` for gameplay timing; never direct Tone.js reads = Important. |
| Colors | No hardcoded hex values — use CSS variables (`var(--color-*)`) or `getPixiColorFromToken()` = Minor. |
| React components | No `.propTypes` added = Minor. |
| Commits | Conventional Commits format = Minor if missing. |

### 4. Post your review

Post **inline comments** on the specific lines where issues occur — this is what makes a review
actionable. Use the GitHub review API (submit a review with `COMMENT` or `REQUEST_CHANGES` event)
to attach line-level comments.

For each Important or Critical finding, post an inline comment on the affected line with:
- What the problem is
- Why it matters
- A concrete suggestion for fixing it

Then post a **top-level summary** with `github-mcp-server-add_issue_comment` using this format:

```
## Code Review

### Summary
[1–3 sentences: what the PR does and overall quality]

### Critical
- **[Title]** — `file.ts:line` — [what's wrong and why]

### Important
- **[Title]** — `file.ts:line` — [what's wrong and why]

### Minor
- **[Title]** — `file.ts:line` — [brief note, fix is obvious]

### Verdict
**[Approve / Request changes / Comment]** — [one sentence rationale]
```

Omit severity sections with no findings. If the PR is clean, say so and approve.

## Severity Guide

| Level | Criteria |
|-------|----------|
| **Critical** | Data loss, security vulnerability, broken functionality, direct state mutation |
| **Important** | Logic error, missing test for changed code, backward-compat breakage, `Number()` coercion |
| **Minor** | Missing locale key, hardcoded color, unclear naming, dead import |

When unsure, say so — "I can't verify this without running the code" is better than a false finding.

## Example

```
User: Review PR #47

→ pull_request_read method=get        # title: "Add streak bonus to gig score"
→ pull_request_read method=get_commits # "feat(gig): add streak multiplier"
→ pull_request_read method=get_review_comments  # no existing threads
→ pull_request_read method=get_diff

[Diff shows gigReducer.js:84 computes bonus using Number(state.streak) * 1.1]

→ Post inline comment on gigReducer.js:84:
  "Number(state.streak) accepts non-numeric values. Use isFiniteNumber(state.streak) instead,
   which rejects booleans, strings, and NaN (per AGENTS.md architecture constraint)."

→ post add_issue_comment:

## Code Review

### Summary
Adds a streak multiplier to the gig score. Core logic is sound; one type-safety issue to fix.

### Important
- **Number() coercion in streak bonus** — `src/reducers/gigReducer.js:84` — `Number(state.streak)`
  accepts booleans and strings from persisted state. Replace with `isFiniteNumber(state.streak)`.

### Verdict
**Request changes** — One important fix; otherwise ready to merge.
```

## When There's Nothing to Fix

```
## Code Review

### Summary
Refactors the venue selector to use the existing `getRegionKeyForLocation` helper throughout.
Clean change — no logic added, existing tests cover the paths.

### Verdict
**Approve** — No issues found. Consistent with codebase conventions.
```
