# Open Agent Skills References

## Specifications

- https://agentskills.io/specification — Open Agent Skills format specification
- https://developers.openai.com/codex/skills — Codex-specific skills integration guide

## Reference Implementations

- https://github.com/anthropics/skills — Example skills from Anthropic
- https://github.com/openai/skills — Example skills from OpenAI
- https://github.com/agentskills/agentskills/tree/main/skills-ref — Validation reference library

## Key Requirements

- `SKILL.md` is required with `name` and `description` frontmatter
- `name` must be lowercase alphanumeric + hyphens, max 64 chars, must match directory name
- `description` max 1024 chars, should describe what and when
- Optional: `license`, `compatibility`, `metadata`, `allowed-tools` frontmatter fields
- Optional: `agents/openai.yaml` for Codex UI customization and dependency declaration
- Optional: `scripts/`, `references/`, `assets/` directories
- SKILL.md body recommended under 500 lines / 5000 tokens (progressive disclosure)
