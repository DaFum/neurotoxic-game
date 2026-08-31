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

Review a pull request and post clear, evidence-backed feedback using the GitHub MCP tools. Lead
with inline comments on the specific lines that need changing — they are far more actionable than a
summary — then close with a top-level verdict comment.

**Core principle:** Report only high-confidence findings. Every finding cites a specific file:line.
Never flag style preferences unless an explicit repo rule is being broken.

## Reference Files

Load these as needed:

- **`references/neurotoxic-conventions.md`** — Full repo-specific rules with severity and source
  paths. Load when the diff touches any file in `src/`.
- **`references/review-checklist.md`** — Per-file-type checklists (reducers, action creators,
  sanitizers, locale files, etc.). Load when reviewing a specific domain.
- **`references/output-formats.md`** — Inline comment templates, summary template, verdict
  decision tree, tone guide. Load when composing feedback.

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

If the description is missing or a single line, note it as a Minor finding.

### 2. Load reference files for the changed domains

Scan the file list and load the matching checklists from `references/review-checklist.md`. For any
`src/` file, also load `references/neurotoxic-conventions.md`.

For diffs larger than 500 changed lines, call `pull_request_read method=get_files` first to
identify which domains are touched, then triage by risk tier (see checklist §12).

### 3. Read the diff

```
pull_request_read  method=get_diff
```

Work through each changed production file against the loaded checklists. For each file, ask:

1. Does this do what the commits/description claim?
2. Any logic errors, off-by-one, or uncovered edge cases?
3. Any security implications (unsanitized input, auth bypass, secret exposure)?
4. Does it break existing contracts (API shape, action payload, state schema)?
5. Is the new code covered by tests that exercise the actual logic?

### 4. Post inline comments, then a summary

See `references/output-formats.md` for templates and the verdict decision tree.

**Inline first.** For every Important or Critical finding, post an inline comment on the specific
changed line with: what the problem is, why it matters, and a concrete fix.

**Then post the top-level summary** using `github-mcp-server-add_issue_comment`.

## Quick Severity Reference

| Level | Criteria |
|-------|----------|
| **Critical** | Data loss, security vulnerability, direct state mutation, broken functionality |
| **Important** | Logic error, `Number()` coercion, missing `finiteNumberOr`, missing test for changed code |
| **Minor** | Missing locale key, hardcoded color, no Conventional Commit format |

Full rules with source paths: `references/neurotoxic-conventions.md`.
