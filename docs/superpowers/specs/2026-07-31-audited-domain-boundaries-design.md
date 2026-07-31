# Audited Domain Boundaries Design

## Goal

Verify the ten reported event, quest, reward, venue-scope, and contraband boundary defects and correct every finding reproduced on the current branch without broad model migrations.

## Approach

Use surgical boundary hardening. Each reported behavior receives a focused regression test that is observed failing before production code changes. Confirmed defects are corrected at the earliest existing validation or normalization boundary, preserving established data shapes and registered content.

## Event resolution

- Normalize compatibility story sentinels on a copied flags object and dispatch that normalized copy, removing `addStoryFlag` when it represented `addQuest`, `unlock`, or `gameOver`.
- Reject a quest that supplies an invalid `deadlineOffset`; never erase malformed timing data and admit it as untimed.
- Trigger game-over side effects only for the exact boolean `true`.

## Quest admission and scope

- Require positive finite quest completion thresholds.
- Admit only `active` quests to `activeQuests`, including ad-hoc definitions.
- Reject forbidden own keys recursively throughout raw quest payloads and nested records.
- Resolve current venue scope from `currentGig.id` or the canonical venue ID embedded in the current GIG map node. A map-node ID is never a venue ID.

## Rewards and contraband

- Restrict follower platforms to supported numeric follower counters in social state.
- Reject quantity-bearing `item.add` rewards because the existing inventory contract is boolean-valued; amount-less rewards remain supported.
- Reject `applyOnAdd: true` on non-equipment contraband because only equipment has insertion-time application behavior.

## Testing

Extend the existing focused node suites for event resolution, quest lifecycle/rewards, and contraband schemas. Tests use real domain functions and adversarial JSON payloads where needed. Run focused suites during red/green cycles, followed by type checks, symbol regeneration/checks, lint/test/build quality gating, and the full PR test gate.

## Instruction coverage

Touched source files are governed by `src/domain/AGENTS.md` or `src/schemas/AGENTS.md`; touched tests are governed by `tests/AGENTS.md`. These already contain clear local boundary conventions, so no additional nested instruction file is required.
