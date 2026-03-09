# Mega Lint Snapshot Tool Map

This reference lists the intended tooling for each MegaLinter-style category.
If a tool is missing locally, the runner will report the error and continue.

## Categories

- **BASH**: Shellcheck for `.sh` files.
- **BASH_EXEC**: Ensure shell scripts are executable.
- **CHECKOV**: IaC scanning (optional in this repo).
- **GITLEAKS**: Secret scanning (optional in this repo).
- **JAVASCRIPT_ES**: `npm run lint` (ESLint).
- **JAVASCRIPT_PRETTIER**: `npm run format -- --check` (Prettier check).
- **JSCPD**: Duplicate code detection.
- **JSON**: Parse JSON files with Node.
- **JSON_PRETTIER**: Prettier check for JSON files.
- **MARKDOWN**: Markdown linting.
- **MARKDOWN_PRETTIER**: Prettier check for Markdown files.
- **NATURAL_LANGUAGE**: Textlint for markdown/text (optional).
- **SHELL_SHFMT**: shfmt formatting check.
