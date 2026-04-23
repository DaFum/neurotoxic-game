---
name: skill-creator
description: Use this whenever users ask to create a skill, improve/refactor an existing skill, evaluate skill behavior, benchmark variance, or convert a repeatable workflow into a reusable agent instruction set. Trigger aggressively on phrases like "make a skill", "improve my SKILL.md", "benchmark/eval this skill", "turn this into a skill", references to `.skill`/`SKILL.md`, or requests for trigger tuning, edge-case handling, or instruction-following reliability. Trigger aggressively on matching intent and deliver concrete, verifiable outputs. Use mode-correct workflows (Create/Improve/Eval/Benchmark) and tie every improvement to measurable evidence.
compatibility: Node.js 22.13+, pnpm
metadata:
  version: '1.0.0'
  author: 'neurotoxic-project'
  category: 'meta'
  keywords: ['meta', 'skills', 'creation', 'evaluation']
  maturity: 'stable'
license: 'Proprietary. See LICENSE.txt for terms'
---

# Skill Creator

## Table of Contents
- [How This Works](#how-this-works)
- [Talking to the User](#talking-to-the-user)
- [Modes](#modes)
- [Creating a Skill](#creating-a-skill)
- [Skill Writing Guide](#skill-writing-guide)
- [Common Anti-Patterns](#common-anti-patterns)
- [Debugging Skills](#debugging-skills)
- [Improving a Skill](#improving-a-skill)
- [Eval Mode](#eval-mode)
- [Benchmark Mode](#benchmark-mode)
- [Building Blocks](#building-blocks)
- [Environment and Delegation](#environment-and-delegation)
- [Task Tracking](#task-tracking)
- [Workspace Structure](#workspace-structure)
- [Coordinator Responsibilities](#coordinator-responsibilities)
- [Intent Routing Matrix](#intent-routing-matrix)
- [Output Contract (Skill-Creator Specific)](#output-contract-skill-creator-specific)
- [Cut-List Checklist (Do Not Ship Without)](#cut-list-checklist-do-not-ship-without)


Create new skills, improve existing ones, and measure their performance through structured evaluation.

## How This Works

1. Decide what the skill should do and roughly how
2. Write a draft
3. Create test prompts and run Codex-with-the-skill on them
4. Evaluate results — automated evals, human review, or both (human review is often the only way)
5. Rewrite the skill based on feedback
6. Repeat until satisfied, then expand the test set

Your job: figure out where the user is in this process and help them move forward. If they want to create from scratch, help draft and test. If they have a draft, go straight to eval/iterate. If they just want to vibe, do that.

---

## Talking to the User

People using this skill range from veteran developers to parents who just discovered Codex can build things for them. Pay attention to context cues:

- "evaluation" and "benchmark" are fine for most users
- "JSON", "assertion", "subagent" — use only when the user signals familiarity
- When in doubt, explain terms briefly. A short definition costs nothing.

---

## Modes

| Mode          | When to Use                       | Workflow                                                        |
| ------------- | --------------------------------- | --------------------------------------------------------------- |
| **Create**    | "I want to make a skill for X"    | Interview → Research → Draft → Run → Refine                     |
| **Improve**   | "Make my skill better"            | Execute → Grade → Compare → Analyze → Apply                     |
| **Eval**      | "Test my skill on this case"      | Execute → Grade → Results                                       |
| **Benchmark** | "How well does my skill perform?" | 3× runs per config → Aggregate → Analyze _(requires subagents)_ |

See `references/mode-diagrams.md` for visual workflow diagrams.

---

## Creating a Skill

The most common entry point. Users either describe something from scratch or say "turn this conversation into a skill."

### Capture Intent

If the conversation already contains a workflow, extract what you can first: tools used, steps taken, corrections made, input/output formats. Then confirm and fill gaps.

Key questions:

1. What should this skill enable Codex to do?
2. When should it trigger? (what user phrases or contexts?)
3. What's the expected output format?
4. Should we set up test cases? Objectively verifiable outputs (file transforms, data extraction, code generation) benefit from them. Subjective outputs (writing style, art) often don't. Suggest the right default but let the user decide.

### Interview and Research

Proactively ask about edge cases, formats, example files, success criteria, dependencies. Check available MCPs for research. Come prepared to reduce burden on the user.

### Initialize and Draft

```bash
scripts/init_skill.py <skill-name> --path <output-directory>
```

Fill the YAML frontmatter based on the interview:

- **name**: Skill identifier
- **description**: When to trigger and what it does. This is the primary triggering mechanism. Codex tends to _undertrigger_ skills, so make descriptions pushy — enumerate specific contexts, keywords, and edge cases.
- **compatibility**: Required tools/dependencies (optional, rarely needed)

Then write the skill body following the **Skill Writing Guide** below.

### Immediate Feedback Loop

**Always have something cooking.** Every time the user adds an example or input:

1. Immediately start running it — don't wait for full specification
2. Show outputs: "The output is at X, take a look"
3. Run first examples in the main agent loop so the user sees the transcript
4. Seeing what Codex does helps the user refine requirements

### Test and Iterate

After the draft, create 2–3 realistic test prompts — what a real user would actually say. Share them: "Here are a few test cases I'd like to try. Do these look right?" Then run them.

For formal evals, create `evals/evals.json` — initialize with `scripts/init_json.py evals evals/evals.json`. See `references/schemas.md` for the full schema.

Once gradable criteria exist, iterate more aggressively: run tests automatically, present results ("I tried X, it improved pass rate by Y%").

### Package and Present

If `present_files` is available, package the skill:

```bash
scripts/package_skill.py <path/to/skill-folder>
```

Direct the user to the `.skill` file to install it.

---

## Skill Writing Guide

### Anatomy

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description required)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/    - Executable code for deterministic/repetitive tasks
    ├── references/ - Docs loaded into context as needed
    └── assets/     - Files used in output (templates, icons, fonts)
```

No README.md, INSTALLATION_GUIDE.md, or CHANGELOG.md — skills are for AI agents, not human onboarding.

### Progressive Disclosure

1. **Metadata** (name + description) — Always in context (~100 words)
2. **SKILL.md body** — In context when skill triggers (<500 lines ideal)
3. **Bundled resources** — Loaded as needed (unlimited; scripts run without loading)

Keep SKILL.md under 500 lines. If approaching this limit, push detail into `references/` with clear pointers. For large reference files (>300 lines), include a table of contents.

### Writing Philosophy

Use the imperative form. Explain the **why** behind instructions — today's LLMs are smart and have good theory of mind. When they understand the reasoning, they go beyond rote execution and make genuinely good decisions.

If you find yourself writing ALWAYS or NEVER in all caps, or imposing super rigid structures, that's a yellow flag. Reframe and explain the reasoning. A humane, explanatory approach is more powerful and effective than a wall of MUSTs.

Include 1–2 concrete input→output examples — models learn as much from examples as from instructions.

### Domain Organization

When a skill supports multiple domains:

```
cloud-deploy/
├── SKILL.md (workflow + selection)
└── references/
    ├── aws.md, gcp.md, azure.md
```

Codex reads only the relevant reference file.

---

## Common Anti-Patterns

When writing or reviewing a skill, check for these failure modes:

| Anti-Pattern           | Symptom                                            | Fix                                                                                       |
| ---------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Overfitter**         | Works on test cases, fails on everything else      | Generalize from feedback — the skill serves millions of prompts, not just your 3 examples |
| **Undertrigger**       | Codex doesn't use the skill when it should         | Make the description pushy — enumerate contexts, keywords, edge cases                     |
| **Wall of Text**       | 800+ line SKILL.md, model ignores parts            | Use progressive disclosure — core workflow in SKILL.md, details in `references/`          |
| **Micromanager**       | MUST/ALWAYS/NEVER everywhere, no room for judgment | Explain why things matter; trust the model's intelligence                                 |
| **Missing Example**    | Describes what to do but never shows good output   | Include 1–2 concrete input→output examples                                                |
| **Silent Failure**     | No guidance when things go wrong                   | Add error handling and fallback instructions                                              |
| **Phantom Dependency** | References tools/libs that may not exist           | Check availability at runtime; use `compatibility` frontmatter                            |

---

## Debugging Skills

### Skill Isn't Triggering

- Check the description — does it cover the user's phrasing? Add more trigger scenarios and keywords.
- Test with the exact phrases a real user would say.

### Model Ignores Instructions

- Read the _transcript_, not just the output. Find where the model diverged.
- Important things should be early and prominent, not buried.
- Try explaining _why_ instead of just commanding.
- Check for contradictions between parts of the skill.

### Inconsistent Results

- Run the same prompt 3 times. High variance = underspecified skill.
- Add more concrete examples. Make ambiguous instructions explicit.

### Skill Is Too Slow

- Read the transcript for wasted steps — trim instructions causing unproductive work.
- Move heavy reference material to bundled files.
- Consider scripts for repetitive work.

---

## Improving a Skill

When the user asks to improve an existing skill, establish: which skill, how much time, and what's the goal.

**Read these before starting:**

```
references/improve-workflow.md    # Complete iteration loop
references/schemas.md             # JSON output structures
```

### Philosophy

1. **Generalize, don't overfit.** You're iterating on few examples to move fast, but the skill needs to work everywhere. Rather than narrow fixes, try different metaphors, patterns, or framings.
2. **Keep it lean.** Remove what isn't pulling weight. Read transcripts — if the model wastes time on unproductive steps, trim the causing instructions.
3. **Explain the why.** Understand what the user actually wants and transmit that understanding. Rigid MUST/NEVER rules → reframe as reasoning.

### Core Loop

Copy skill to workspace → Execute on evals → Grade → Blind compare against best version → Analyze winner → Apply improvements → Repeat until goal/timeout/diminishing returns.

---

## Eval Mode

Test skill performance on individual evals.

**Read:** `references/eval-mode.md` and `references/schemas.md` before running.

Workflow: Setup → Check Dependencies → Prepare → Execute → Grade → Display Results.

Without subagents, execute and grade sequentially — read `agents/executor.md` and `agents/grader.md` and follow procedures directly.

---

## Benchmark Mode

Standardized performance measurement with variance analysis. **Requires subagents.**

**Read:** `references/benchmark-mode.md` and `references/schemas.md` before running.

Runs all evals, 3 times per configuration, always includes no-skill baseline, uses most capable model for analysis.

---

## Building Blocks

| Block                 | Input                         | Output                       | Agent                  |
| --------------------- | ----------------------------- | ---------------------------- | ---------------------- |
| **Eval Run**          | skill + prompt + files        | transcript, outputs, metrics | `agents/executor.md`   |
| **Grade**             | outputs + expectations        | pass/fail per expectation    | `agents/grader.md`     |
| **Blind Compare**     | output A, output B, prompt    | winner + reasoning           | `agents/comparator.md` |
| **Post-hoc Analysis** | winner + skills + transcripts | improvement suggestions      | `agents/analyzer.md`   |

---

## Environment and Delegation

Check whether you can spawn subagents for parallel execution.

**With subagents**: Spawn independent agents with reference file paths. Parallelize independent work (e.g., 3 runs of the same version).

**Without subagents**: Read agent reference files and follow procedures inline/sequentially. Acknowledge reduced rigor — same context that executes also grades.

### No-Subagent Rigor Protocol (Directional Mode)

When subagents are unavailable, explicitly mark outputs as **directional** and use compensating controls so conclusions stay useful and honest:

1. Run each critical eval at least 3 times sequentially to surface variance.
2. Tighten expectations before comparing versions (reject weak presence-only assertions).
3. Separate execution notes from grading notes in distinct files/sections.
4. State confidence using labels: `high`, `medium`, `low` with one-line justification.
5. Do not declare definitive superiority unless evidence is consistent across repeated runs.

This preserves momentum while avoiding overconfident claims from single-context evaluation.

### Evidence & Citation Contract

For Improve/Benchmark reports, cite concrete artifacts for every material claim:

- `transcript.md` lines for step-by-step behavior
- `metrics.json` for tool/step variance
- `grading.json` for pass-rate and claim verification
- `comparison.json` + `posthoc-analysis.md` for winner rationale

If evidence is missing, downgrade confidence and call out the gap explicitly instead of inferring certainty.

---

## Task Tracking

If your environment supports task management (`TaskCreate`/`TaskUpdate`):

```
pending → planning → implementing → reviewing → verifying → completed
```

If not available, track progress conversationally. The workflows are the same either way.

---

## Workspace Structure

Workspaces are sibling directories to the skill. See `references/schemas.md` for full layout.

```
parent-directory/
├── skill-name/                      # The skill
│   ├── SKILL.md
│   ├── evals/
│   └── scripts/
└── skill-name-workspace/            # Workspace
    ├── history.json                 # Version progression
    ├── v0/, v1/, ...               # Versioned copies + runs
    ├── grading/                    # Blind comparisons
    └── benchmarks/                 # Benchmark results
```

---

## Coordinator Responsibilities

1. Delegate to subagents when available; execute inline otherwise
2. In Create mode, run examples in main loop so user sees the transcript
3. Use independent grading when possible for unbiased evaluation
4. Track the **best** version — not necessarily the latest
5. Run 3× for variance with subagents; 1× without
6. Parallelize independent work when subagents are available
7. Report results clearly with evidence and metrics
8. Review `user_notes` for issues that passed expectations might miss
9. Capture execution metrics in Benchmark mode
10. Use most capable model for analysis in Benchmark mode

## Intent Routing Matrix

Use the first matching route:

1. **Create Route** — user asks to create/author a new skill from scratch.
2. **Improve Route** — user asks to optimize/refactor existing `SKILL.md` behavior.
3. **Eval Route** — user asks for pass/fail against one prompt or case.
4. **Benchmark Route** — user asks for comparative performance/variance across runs.

If a request mixes routes, split work into phases (e.g., Improve → Eval, or Create → Eval).

## Output Contract (Skill-Creator Specific)

Every completion must include:

- `Selected route` + why.
- `Artifacts produced` (exact files/paths).
- `Measured result` (pass rate / winner / confidence).
- `Next iteration plan` with 1–3 concrete changes.

## Cut-List Checklist (Do Not Ship Without)

- [ ] No generic filler instructions that could apply to any unrelated skill.
- [ ] Every recommendation is linked to transcript/eval evidence.
- [ ] No-subagent runs are labeled directional with explicit confidence.
- [ ] Proposed changes are reversible and scoped to requested goals.

_Skill sync: compatible with React 19.2.4 / Vite 8.0.1 baseline as of 2026-03-18._
