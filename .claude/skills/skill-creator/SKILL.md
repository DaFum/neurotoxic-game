---
name: skill-creator
description: create new skills, improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, update or optimize an existing skill, run evals to test a skill, or benchmark skill performance with variance analysis. Also trigger when users say things like "turn this into a skill", "make a skill for X", "help me improve my skill", "test my skill", "evaluate skill performance", or reference any .skill file or SKILL.md. Even if the user just describes a repeatable workflow they want to capture, consider suggesting a skill.
---

# Skill Creator

Create new skills, improve existing ones, and measure their performance through structured evaluation.

## How This Works

1. Decide what the skill should do and roughly how
2. Write a draft
3. Create test prompts and run claude-with-the-skill on them
4. Evaluate results — automated evals, human review, or both (human review is often the only way)
5. Rewrite the skill based on feedback
6. Repeat until satisfied, then expand the test set

Your job: figure out where the user is in this process and help them move forward. If they want to create from scratch, help draft and test. If they have a draft, go straight to eval/iterate. If they just want to vibe, do that.

---

## Talking to the User

People using this skill range from veteran developers to parents who just discovered Claude can build things for them. Pay attention to context cues:

- "evaluation" and "benchmark" are fine for most users
- "JSON", "assertion", "subagent" — use only when the user signals familiarity
- When in doubt, explain terms briefly. A short definition costs nothing.

---

## Modes

| Mode | When to Use | Workflow |
|------|-------------|----------|
| **Create** | "I want to make a skill for X" | Interview → Research → Draft → Run → Refine |
| **Improve** | "Make my skill better" | Execute → Grade → Compare → Analyze → Apply |
| **Eval** | "Test my skill on this case" | Execute → Grade → Results |
| **Benchmark** | "How well does my skill perform?" | 3× runs per config → Aggregate → Analyze *(requires subagents)* |

See `references/mode-diagrams.md` for visual workflow diagrams.

---

## Creating a Skill

The most common entry point. Users either describe something from scratch or say "turn this conversation into a skill."

### Capture Intent

If the conversation already contains a workflow, extract what you can first: tools used, steps taken, corrections made, input/output formats. Then confirm and fill gaps.

Key questions:
1. What should this skill enable Claude to do?
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
- **description**: When to trigger and what it does. This is the primary triggering mechanism. Claude tends to *undertrigger* skills, so make descriptions pushy — enumerate specific contexts, keywords, and edge cases.
- **compatibility**: Required tools/dependencies (optional, rarely needed)

Then write the skill body following the **Skill Writing Guide** below.

### Immediate Feedback Loop

**Always have something cooking.** Every time the user adds an example or input:

1. Immediately start running it — don't wait for full specification
2. Show outputs: "The output is at X, take a look"
3. Run first examples in the main agent loop so the user sees the transcript
4. Seeing what Claude does helps the user refine requirements

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

Claude reads only the relevant reference file.

---

## Common Anti-Patterns

When writing or reviewing a skill, check for these failure modes:

| Anti-Pattern | Symptom | Fix |
|---|---|---|
| **Overfitter** | Works on test cases, fails on everything else | Generalize from feedback — the skill serves millions of prompts, not just your 3 examples |
| **Undertrigger** | Claude doesn't use the skill when it should | Make the description pushy — enumerate contexts, keywords, edge cases |
| **Wall of Text** | 800+ line SKILL.md, model ignores parts | Use progressive disclosure — core workflow in SKILL.md, details in `references/` |
| **Micromanager** | MUST/ALWAYS/NEVER everywhere, no room for judgment | Explain why things matter; trust the model's intelligence |
| **Missing Example** | Describes what to do but never shows good output | Include 1–2 concrete input→output examples |
| **Silent Failure** | No guidance when things go wrong | Add error handling and fallback instructions |
| **Phantom Dependency** | References tools/libs that may not exist | Check availability at runtime; use `compatibility` frontmatter |

---

## Debugging Skills

### Skill Isn't Triggering
- Check the description — does it cover the user's phrasing? Add more trigger scenarios and keywords.
- Test with the exact phrases a real user would say.

### Model Ignores Instructions
- Read the *transcript*, not just the output. Find where the model diverged.
- Important things should be early and prominent, not buried.
- Try explaining *why* instead of just commanding.
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

| Block | Input | Output | Agent |
|-------|-------|--------|-------|
| **Eval Run** | skill + prompt + files | transcript, outputs, metrics | `agents/executor.md` |
| **Grade** | outputs + expectations | pass/fail per expectation | `agents/grader.md` |
| **Blind Compare** | output A, output B, prompt | winner + reasoning | `agents/comparator.md` |
| **Post-hoc Analysis** | winner + skills + transcripts | improvement suggestions | `agents/analyzer.md` |

---

## Environment and Delegation

Check whether you can spawn subagents for parallel execution.

**With subagents**: Spawn independent agents with reference file paths. Parallelize independent work (e.g., 3 runs of the same version).

**Without subagents**: Read agent reference files and follow procedures inline/sequentially. Acknowledge reduced rigor — same context that executes also grades.

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

_Skill sync: compatible with React 19.2.4 / Vite 7.3.1 baseline as of 2026-02-17._
