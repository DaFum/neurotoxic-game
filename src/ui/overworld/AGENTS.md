# src/ui/overworld - Agent Instructions

- Overworld header/HUD/menu split is intentional: derive gameplay state in `src/scenes/Overworld.tsx` or an Overworld hook, then pass typed props into these view components. If a required prop is missing or invalid, fix the caller/type contract instead of adding local gameplay derivation.
- Event log entries must remain append-safe: append new entries with generated IDs, preserve insertion order while capping old entries, and store entry kind/payload or i18n keys, never pre-translated strings. Translate at render with `defaultValue` fallbacks for missing keys.
