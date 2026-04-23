# Documentation

This directory contains the documentation for the project.
Currently, it consists of Markdown files.

## Local Building

Since there is no static site generator (like MkDocs or Sphinx) currently configured, you can view the documentation by reading the Markdown files directly on GitHub or using any local Markdown viewer.

To lint documentation:
```bash
pnpm dlx markdownlint-cli "**/*.md"
```


## Agent Guidance

This project uses AI agents to assist with development. Agents should be used to speed up boilerplate creation, assist in debugging, and refactor code according to the standards outlined in `AGENTS.md`.

**Limitations:**
- Agents do not replace human review. All agent-generated code must be thoroughly tested and reviewed.
- Agents may not perfectly understand complex game balance changes or nuanced UI/UX requirements.
- Agents must strictly adhere to the project's pnpm-exclusive policy and other rules defined in `AGENTS.md`.

**When to use them:**
- To generate tests, documentation, or boilerplate code.
- To analyze logs or debug failing CI runs.
- To perform widespread, repetitive refactoring tasks.
