1. **Identify the optimization target:**
   In `src/utils/gameState/delta.ts`, the function `calculateAppliedDelta` uses `Array.prototype.filter` to process `delta.band.relationshipChange`:
   ```typescript
      if (Array.isArray(delta.band.relationshipChange)) {
        applied.band.relationshipChange = delta.band.relationshipChange.filter(
          rc =>
            isRelationshipChange(rc) &&
            isNotSelfRelationship(rc as RelationshipChange)
        )
   ```
   This creates a closure and an intermediate array for the filtered results. Since this is in `calculateAppliedDelta`, which is part of the high-frequency event/reducer cycle, replacing it with a procedural loop can avoid closure allocations and improve performance, which aligns with Bolt's performance philosophy regarding `.filter()` replacements.

2. **Implement the procedural loop:**
   Use the `replace_with_git_merge_diff` tool on `src/utils/gameState/delta.ts` to replace the `filter` call with a procedural `for` loop.

3. **Complete pre-commit steps:**
   Run `pre_commit_instructions` tool to get the required checks and complete pre-commit steps to ensure proper testing, verification, review, and reflection are done. Ensure `pre-commit` is hyphenated.

4. **Verify and submit:**
   Run tests (e.g. `node --test tests/node/gameStateDelta.test.js` or via standard vitest configs as applicable) to ensure the logic remains intact.
   Submit the PR with the title `⚡ Bolt: Optimize relationshipChange filtering in calculateAppliedDelta`.
