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

## Quick Mode Detector

Identify the user's intent from their phrasing:

| User Says | Mode | Next Step |
|-----------|------|-----------|
| "turn this into a skill" / "make a skill for X" / "capture this workflow" | **Create** | Jump to Creating a Skill (Interview) |
| "make my skill better" / "improve this skill" / "this skill isn't working" | **Improve** | Jump to Improving a Skill |
| "test my skill on this case" / "does this work?" | **Eval** | Jump to Eval Mode |
| "how well does my skill work?" / "measure performance" | **Benchmark** | Jump to Benchmark Mode (requires subagents) |

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

1. What should this skill enable Claude to do?
2. When should it trigger? (what user phrases or contexts?)
3. What's the expected output format?
4. Should we set up test cases? Objectively verifiable outputs (file transforms, data extraction, code generation) benefit from them. Subjective outputs (writing style, art) often don't. Suggest the right default but let the user decide.

### Interview and Research

Proactively ask about edge cases, formats, example files, success criteria, dependencies. Check available MCPs for research. Come prepared to reduce burden on the user.

### Initialize and Draft

```bash
python scripts/init_skill.py <skill-name> --path <output-directory>
```

Fill the YAML frontmatter based on the interview:

- **name**: Skill identifier
- **description**: When to trigger and what it does. This is the primary triggering mechanism. Claude tends to _undertrigger_ skills, so make descriptions pushy — enumerate specific contexts, keywords, and edge cases.
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

For formal evals, create `evals/evals.json` — initialize with `python scripts/init_json.py evals evals/evals.json`. See `references/schemas.md` for the full schema.

Once gradable criteria exist, iterate more aggressively: run tests automatically, present results ("I tried X, it improved pass rate by Y%").

### Package and Present

Once satisfied with the skill, package it for distribution:

```bash
python scripts/package_skill.py <path/to/skill-folder>
```

This generates a `.skill` file that users can install directly. Guide them to the file.

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

| Anti-Pattern           | Symptom                                            | Fix                                                                                       |
| ---------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Overfitter**         | Works on test cases, fails on everything else      | Generalize from feedback — the skill serves millions of prompts, not just your 3 examples |
| **Undertrigger**       | Claude doesn't use the skill when it should        | Make the description pushy — enumerate contexts, keywords, edge cases                     |
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

## Common Scenarios & Practical Tips

### I want to improve a skill but don't have evals yet

**Start here**: Create 2–3 test cases manually. Don't wait for a perfect eval suite.

1. List what the skill *should* do in a few bullet points
2. Come up with 2–3 realistic prompts users would actually say
3. Run the skill on those prompts in the main agent loop (run in background so user sees the transcript)
4. From the transcript, identify 1–2 concrete expectations (e.g., "should mention X", "should run tool Y", "should return JSON")
5. Write those as informal evals in `evals/evals.json` using `python scripts/init_json.py evals evals/evals.json`
6. Now you can iterate with structured feedback

### The skill works on my test cases but fails on edge cases

This is overfitting. The skill is too tailored to your specific examples.

**Solution**:
- Rewrite instructions to be more general (instead of "when the user says 'analyze my code'", say "when the user wants to understand code behavior, whether they ask to 'review', 'explain', 'analyze', or 'debug'")
- Remove references to specific tool chains or frameworks (use "any build tool", "any test runner" instead of hardcoding)
- Test on 3–5 additional prompts that are similar but not identical to your original cases
- Look for the principle behind your examples, not the exact pattern

### I'm not sure if the skill is actually better

Use blind comparison. Create two versions, run them both on the same eval, then have me compare without knowing which is which. This removes confirmation bias.

```
Execute v0 on eval → save to v0/
Execute v1 on eval → save to v1/
Compare results → I pick the winner based only on quality, not lineage
Explain why the winner is better
```

### The skill takes too long to load or trigger

**Problem**: The SKILL.md is huge (600+ lines), has too many options, or references are loaded upfront.

**Solution**:
- Shrink SKILL.md to <500 lines
- Move detailed workflows to `references/` (only loaded when skill triggers)
- If there are multiple domains (e.g., "cloud-deploy-aws" vs "cloud-deploy-gcp"), split into separate skills or put domain selection logic upfront
- Use scripts for deterministic work instead of inline explanations

### I'm trying to create a skill but keep getting stuck in the interview phase

**Shortcut**: You don't need perfect requirements. Start with a draft instead.

1. Write a rough outline of what the skill should do (5–10 bullet points)
2. Create a minimal SKILL.md with ~200 words
3. Test it on 1–2 prompts you already have in mind
4. Watch the transcript — you'll see what's missing or confusing
5. Refine from there

Iteration beats perfectionism. Ship early, improve based on real behavior.

### Can I test my skill without creating evals?

Yes. In Create mode, run the first few examples directly in the main agent loop. You'll see the transcript, can spot issues immediately, and iterate fast. This is the "Immediate Feedback Loop" mentioned in the Creating a Skill section.

For formal evaluation (comparing with/without skill, measuring consistency), you need evals. But for drafting and early iteration, just run examples.

---

## Improving a Skill

When the user asks to improve an existing skill:

1. **Establish context**: Which skill? What's the goal (trigger rate, output quality, speed)? How much time?
2. **Read reference docs**: `references/improve-workflow.md` and `references/schemas.md`
3. **Run the core loop**: Copy to workspace → Execute on evals → Grade → Compare → Analyze → Apply

### Decision Tree: What's Wrong?

**Symptom: Skill doesn't trigger when it should**
→ **Root cause**: Description is too narrow, doesn't enumerate use cases
→ **Fix**: Make description more pushy; add specific keywords, phrases, and contexts users actually say

**Symptom: Skill produces correct output but takes too many steps**
→ **Root cause**: Instructions are verbose, model wastes time on unproductive detours
→ **Fix**: Trim instructions; remove explanations that don't inform decisions; consolidate related steps

**Symptom: Skill works on test cases but fails on new inputs**
→ **Root cause**: Overfitted to your 2–3 examples, doesn't generalize
→ **Fix**: Broaden instructions; test on edge cases; try different metaphors or mental models

**Symptom: Skill produces inconsistent results (same prompt, different outputs)**
→ **Root cause**: Underspecified; ambiguous instructions leave too much to inference
→ **Fix**: Add concrete examples; clarify when/why to choose between options; make trade-offs explicit

**Symptom: Skill ignores key instructions**
→ **Root cause**: Instructions are buried, contradicted later, or framed as commands instead of reasoning
→ **Fix**: Move important things early and prominent; explain *why* instead of *what to do*; check for contradictions

### Philosophy

1. **Generalize, don't overfit.** You're iterating on few examples, but the skill works everywhere. Try different metaphors, patterns, and framings — not narrow patches.
2. **Keep it lean.** If the model wastes time on unproductive steps, trim the instructions causing them. Remove what isn't pulling weight.
3. **Explain the why.** Understand what the user wants and transmit that understanding. Rigid MUST/NEVER rules are less effective than clear reasoning.

### Core Loop

Copy skill to workspace → Execute on evals → Grade → Blind compare against best version → Analyze winner → Apply improvements → Repeat until goal/timeout/diminishing returns.

---

## Eval Mode

Test skill performance on individual evals.

**Read:** `references/eval-mode.md` and `references/schemas.md` before running.

Workflow: Setup → Check Dependencies → Prepare → Execute → Grade → Display Results.

Without subagents, execute and grade sequentially — read `agents/executor.md` and `agents/grader.md` and follow procedures directly.

Quick checklist:
- Choose workspace location (suggest `<skill-name>-workspace/` sibling)
- Scan skill for dependencies (check `compatibility` field in SKILL.md)
- Run `python scripts/prepare_eval.py <skill> <eval-id> --output-dir <workspace>/`
- Execute (with subagents: spawn executor; without: read agents/executor.md)
- Grade (with subagents: spawn grader; without: read agents/grader.md)
- Display pass/fail per expectation + overall metrics

---

## Benchmark Mode

Standardized performance measurement with variance analysis. **Requires subagents.**

**Read:** `references/benchmark-mode.md` and `references/schemas.md` before running.

Runs all evals 3 times per configuration, always includes no-skill baseline, uses most capable model for analysis.

Quick checklist:
- Read benchmark-mode.md for full procedure
- Run `python scripts/prepare_eval.py` for each eval (parallel OK)
- Spawn 3 executor subagents per eval (parallel execution)
- Spawn grader subagent for each run (parallel grading)
- Aggregate results with `python scripts/aggregate_benchmark.py`
- Analyze via analyzer agent (read `agents/analyzer.md`)

---

## Building Blocks

| Block                 | Input                         | Output                       | Reference                   | Purpose                                                   |
| --------------------- | ----------------------------- | ---------------------------- | --------------------------- | --------------------------------------------------------- |
| **Eval Run**          | skill + prompt + files        | transcript, outputs, metrics | `agents/executor.md`        | Execute skill on a single eval, capture output & timing   |
| **Grade**             | outputs + expectations        | pass/fail per expectation    | `agents/grader.md`          | Evaluate outputs against success criteria                 |
| **Blind Compare**     | output A, output B, prompt    | winner + reasoning           | `agents/comparator.md`      | Compare two outputs objectively (don't reveal lineage)    |
| **Post-hoc Analysis** | winner + skills + transcripts | improvement suggestions      | `agents/analyzer.md`        | Analyze why one skill version beat another                |

**How to use**: With subagents, spawn the subagent with a reference file path. Without subagents, read the reference file and follow procedures directly in the main coordinator loop.

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
