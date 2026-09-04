# Archived Exact-Owner Clarifications

**Status:** Historical review record — **non-normative**.

This file previously acted as a higher-authority override for gaps discovered during review of the Roguelite Expedition implementation plan. That structure created an unsafe amendment chain: an implementation agent could read a child plan and an older clarification in different orders and end up with two plausible contracts.

All still-valid owner/file/effect decisions from this document have now been folded into the numbered child plans:

- `01-expedition-core-extraction.md`
- `02-condition-repairs-cargo.md`
- `03-crew-stress-relationships.md`
- `04-pressure-rivals-contracts.md`
- `05-meta-regions-ascension.md`
- `06-balance-simulator-recalibration.md`

The canonical entrypoint is `docs/superpowers/plans/2026-09-03-roguelite-expedition-implementation-plan-complete.md`.

## Do not implement from this file

This file must not be cited as a source of truth in new code, tests or plan tasks. In particular, do not use it to override a normalized child-plan payload, state shape, owner or gate order.

The following review topics were incorporated directly into the numbered plans and are mentioned here only to preserve review history:

- Sponsor commitment must originate from persisted Social/Brand Deal state; Tour Prep can generate/accept offers through the existing Brand Deal flow before commitment, but reducers never generate random Sponsor offers.
- Rival/Underground node subtypes use the existing map system and validators.
- Rest/bankruptcy/failure routing stays on canonical existing owners.
- Nemesis Sponsor interference extends the real Brand Deal offer pipeline.
- Contextual Finale profiles have explicit production consumers.
- Between-Tour decisions have exact production outcomes.
- HQ transition changes Expedition progression ownership without breaking old saves.
- Rule-changing Legendary capabilities have named production transforms.

If future review finds another ambiguity, edit the owning numbered child plan directly instead of adding another amendment layer here.
