# src/ui/overworld - Agent Instructions

- Overworld header/HUD/menu split is intentional: gameplay-state derivation lives outside these view components; pass precomputed props.
- Event log entries must remain append-safe — store i18n keys, never pre-translated strings.
