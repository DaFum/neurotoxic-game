# Improve Mode Workflow

Complete iteration loop for improving an existing skill through evaluation, comparison, and analysis.

## Setup Phase

### 1. Read Output Schemas

```bash
Read references/schemas.md  # JSON structures for grading, history, comparison, analysis
```

### 2. Choose Workspace Location

**Ask the user** where to put the workspace. Suggest `<skill-name>-workspace/` as a sibling to the skill directory. If the workspace is inside a git repo, suggest adding it to `.gitignore`.

### 3. Copy Skill to v0

```bash
scripts/copy_skill.py <skill-path> <skill-name>-workspace/v0 --iteration 0
```

### 4. Verify or Create Evals

- Check for existing `evals/evals.json`
- If missing, ask user for 2–3 example tasks and create evals
- Use `scripts/init_json.py evals` to create with correct structure

### 5. Create Tasks for Baseline

If task management is available:

```python
for run in range(3):
    TaskCreate(
        subject=f"Eval baseline, run {run+1}"
    )
```

### 6. Initialize history.json

```bash
scripts/init_json.py history <workspace>/history.json
```

Edit to fill in skill_name. See `references/schemas.md` for full structure.

---

## Iteration Loop

For each iteration (0, 1, 2, ...):

### Step 1: Execute (3 Parallel Runs)

Spawn 3 executor subagents in parallel (or run 1 sequentially without subagents). Update task to `implementing`.

With subagents:

```
Read agents/executor.md at: <skill-creator-path>/agents/executor.md

Execute this task:
- Skill path: workspace/v<N>/skill/
- Task: <eval prompt from evals.json>
- Test files: <eval files if any>
- Save transcript to: workspace/v<N>/runs/run-<R>/transcript.md
- Save outputs to: workspace/v<N>/runs/run-<R>/outputs/
```

### Step 2: Grade Assertions

Spawn grader subagents (or grade inline). Update task to `reviewing`.

Grading produces structured pass/fail results for tracking pass rates. The grader also extracts claims and reads user_notes to surface issues that expectations might miss.

**Set the grader up for success**: The grader needs to actually inspect outputs, not just read the transcript. Check the skill for inspection tools it uses and pass those as hints:

```
Read agents/grader.md at: <skill-creator-path>/agents/grader.md

Grade these expectations:
- Assertions: <list from evals.json>
- Transcript: workspace/v<N>/runs/run-<R>/transcript.md
- Outputs: workspace/v<N>/runs/run-<R>/outputs/
- Save grading to: workspace/v<N>/runs/run-<R>/grading.json

To inspect output files:
<include inspection hints from the skill, e.g.:>
<"Use python -m markitdown <file> to extract text content">
```

**Review grading.json**: Check `user_notes_summary` for uncertainties and workarounds. Check `eval_feedback` — if the grader flagged lax assertions or missing coverage, update `evals.json` before continuing. Improving evals mid-loop is fine and often necessary.

**Eval quality loop**: If `eval_feedback` has suggestions, tighten assertions and rerun. Keep iterating until eval_feedback says evals look solid. Consult the user about changes but don't block on approval — keep making progress.

When picking which eval for the quality loop, prefer one where the skill partially succeeds. An eval where everything fails gives the grader nothing to critique. Feedback is most useful when some expectations pass and the grader can assess whether those passes reflect genuine quality.

### Step 3: Blind Compare (If N > 0)

For iterations after baseline, use blind comparison. While grading tracks expectation pass rates, the comparator judges **holistic output quality** using a rubric. Two outputs might both pass all expectations, but one could still be clearly better.

**Blind A/B Protocol:**
1. Randomly assign: 50% chance v<N> is A, 50% chance v<N> is B
2. Record assignment in `workspace/grading/v<N>-vs-best/assignment.json`
3. Comparator sees only "Output A" and "Output B" — never version names

```
Read agents/comparator.md at: <skill-creator-path>/agents/comparator.md

Blind comparison:
- Eval prompt: <the task that was executed>
- Output A: <path to one version's output>
- Output B: <path to other version's output>
- Assertions: <list from evals.json>

You do NOT know which is old vs new. Judge purely on quality.
```

**Winner by majority vote:**
- 2+ comparators prefer A → A wins
- 2+ comparators prefer B → B wins
- Otherwise → TIE

### Step 4: Post-hoc Analysis

After blind comparison, analyze results:

```
Read agents/analyzer.md at: <skill-creator-path>/agents/analyzer.md

Analyze:
- Winner: <A or B>
- Winner skill: workspace/<winner-version>/skill/
- Winner transcript: workspace/<winner-version>/runs/run-1/transcript.md
- Loser skill: workspace/<loser-version>/skill/
- Loser transcript: workspace/<loser-version>/runs/run-1/transcript.md
- Comparison result: <from comparator>
```

### Step 5: Update State

Update task to `completed`. Record results:

```python
if new_version wins majority:
    current_best = new_version

history.iterations.append({
    "version": "v<N>",
    "parent": "<previous best>",
    "expectation_pass_rate": 0.85,
    "grading_result": "won" | "lost" | "tie",
    "is_current_best": bool
})
```

### Step 6: Create New Version (If Continuing)

1. Copy current best to new version:
   ```bash
   scripts/copy_skill.py workspace/<current_best>/skill workspace/v<N+1> \
       --parent <current_best> --iteration <N+1>
   ```

2. Apply improvements from analyzer suggestions

3. Create new tasks for next iteration

4. Continue or stop if:
   - **Time budget exhausted**
   - **Goal achieved** (target quality or pass rate)
   - **Diminishing returns** (no significant improvement in 2 iterations)
   - **User requests stop**

---

## Final Report

When iterations complete:

1. **Best Version**: Which performed best (not necessarily the last)
2. **Score Progression**: Assertion pass rates across iterations
3. **Key Improvements**: What changes had the most impact
4. **Recommendation**: Whether to adopt the improved skill

Copy best skill back:
```bash
cp -r workspace/<best_version>/skill/* ./
```

If `present_files` is available, package and present the improved skill:
```bash
scripts/package_skill.py <path/to/skill-folder>
```

---

## Without Subagents

Improve mode still works but with reduced rigor:

- **Single run per iteration** (not 3) — variance analysis isn't possible
- **Inline execution**: Read `agents/executor.md` and follow directly, then `agents/grader.md`
- **No blind comparison**: You can't meaningfully blind yourself. Instead, compare outputs by re-reading both versions' results and analyzing differences directly.
- **No separate analyzer**: Do the analysis inline after comparing — identify what improved, what regressed, what to try next.
- **Keep everything else**: Version tracking, copy-iterate-grade loop, history.json, stopping criteria all work the same.
- **Acknowledge reduced rigor**: The same context that executed also grades. Results are directional, not definitive.
