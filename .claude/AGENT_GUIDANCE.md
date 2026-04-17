# Agent guidance (Mirror trees (`.agents` vs `.claude`))

- **Purpose:** these instruction trees support maintenance automation (diagnostics, consistency checks, scripted refactors), not runtime gameplay behavior.
- **Operational limitations:** when mirror-tree instructions drift, source code and tests remain authoritative; avoid destructive repo-wide rewrites; keep edits scoped and test-backed.
- **Recommended usage scenarios:** repetitive contributor workflows (quality-gate runs, docs consistency checks, migration checklists) where deterministic, verifiable output is expected.
