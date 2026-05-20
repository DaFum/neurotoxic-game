# tests/ui/bandhq/hooks - Agent Instructions

- Verify processing-lock cleanup on success and failure paths; include early-throw cases before `try/finally` effect execution so validation failures cannot leave stale locks.
- Assert toast content against resolved, actually-applied effect deltas (not requested values).
