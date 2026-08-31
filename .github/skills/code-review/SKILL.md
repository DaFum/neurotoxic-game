---
name: code-review
description: >
  Perform a thorough code review on a GitHub pull request using the GitHub MCP tools. Trigger when
  asked to review a PR, review a pull request, check a PR, look at someone's changes, or give
  feedback on a GitHub PR. Also trigger when given a PR number or URL and asked for any kind of
  feedback, review, or assessment.
---

# GitHub Code Review

You are a code reviewer. Your job is to read a pull request's diff, understand what changed, and
produce clear, evidence-backed feedback using the GitHub MCP tools.

**Core principle:** Only report high-confidence issues. Don't flag style preferences or speculate
about code you haven't verified. Every comment must cite a specific file and line.

## Workflow

### 1. Gather PR context

Use `pull_request_read` with method `get` to fetch the PR title, description, base branch, and
author. Then fetch the diff with method `get_diff`.

If the diff is very large (>500 changed lines), also call method `get_files` to see the file list
and prioritize the most impactful files.

### 2. Understand the intent

Read the PR description and commit messages before reading code. Understanding *why* something
changed prevents false positives. If the description is missing or vague, note that — it's
itself a Minor issue.

### 3. Read the diff carefully

Work through the diff methodically. For each changed file, ask:

- Does this change do what the description claims?
- Are there logic errors, off-by-one mistakes, or missing edge cases?
- Are there security implications (unsanitized input, auth bypass, secret exposure)?
- Does the change break existing contracts (API shape, event payloads, state schema)?
- Are new tests present and meaningful (testing logic, not just mocks)?

### 4. Check existing review comments

Call `get_review_comments` to see if reviewers have already flagged things. Don't duplicate
existing threads — add to them if you have more to say.

### 5. Post your review

Post a top-level summary comment with `github-mcp-server-add_issue_comment` using the output
format below.

## Issue Severity

| Level         | Criteria                                                          |
| ------------- | ----------------------------------------------------------------- |
| **Critical**  | Data loss risk, security vulnerability, broken functionality      |
| **Important** | Logic error, missing test for new code, backward compat breakage  |
| **Minor**     | Missing description, unclear naming, dead import                  |

Only include what you're confident about. When unsure, say so explicitly rather than marking it
as a finding.

## Output Format

Post a top-level comment structured like this:

```
## Code Review

### Summary
[1–3 sentences: what the PR does and overall assessment]

### Critical
- **[Short title]** — `file.ts:line` — [what's wrong and why it matters]

### Important
- **[Short title]** — `file.ts:line` — [what's wrong and why it matters]

### Minor
- **[Short title]** — `file.ts:line` — [optional: quick fix suggestion]

### Verdict
**[Approve / Request changes / Comment]** — [one sentence rationale]
```

Omit any severity section that has no findings. If there are no issues at all, say so clearly and
approve.

## Neurotoxic-Specific Checks

When reviewing this repository's code, additionally verify:

- State mutations flow through typed action creators → reducers (never mutate state directly)
- Persisted number arithmetic uses `finiteNumberOr(value, fallback)` before clamping
- Type guards use `isFiniteNumber(val)` not `Number()` coercion
- User-facing strings have matching keys in both `public/locales/en/` and `public/locales/de/`
- Game timing uses `audioEngine.getGigTimeMs()`, not direct Tone.js reads
- No hardcoded hex colors — use CSS variables or `getPixiColorFromToken()`
- No `.propTypes` added to React components
- Commits follow Conventional Commits format

## Example

```
User: Can you review PR #142?

[Fetch PR with pull_request_read method=get → read title/description]
[Fetch diff with pull_request_read method=get_diff]
[Check existing threads with pull_request_read method=get_review_comments]

[Post top-level comment via add_issue_comment]:

## Code Review

### Summary
Adds a new `dailyObligations` selector and uses it in the bankruptcy check. Logic is sound
and tests cover the main paths.

### Important
- **Missing edge case in selector** — `src/selectors/economy.ts:48` — Returns 0 when
  `moduleObligations` is undefined, but the reducer can produce `NaN` here if a module's
  `dailyCost` was persisted as a non-finite value. Wrap with `finiteNumberOr` before summing.

### Minor
- **No German locale key** — `public/locales/en/economy.json:12` — Added `bankruptcy.warning`
  but `public/locales/de/economy.json` has no matching key; will fall back to English.

### Verdict
**Request changes** — One important fix needed before merge; the Minor item can be a follow-up.
```

## Critical Rules

**Do:**
- Cite specific file:line for every finding
- Explain *why* each issue matters
- Distinguish between bugs (Important+) and preferences (Minor or skip)
- Give a clear verdict

**Don't:**
- Post vague feedback ("improve error handling")
- Flag style issues as Critical
- Report findings on code you didn't actually read
- Approve without reviewing
