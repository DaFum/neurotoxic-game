# Contributing

We welcome contributions! Please follow these guidelines when contributing:

## Getting Started
1. Fork the repository.
2. Clone your fork and install dependencies using `pnpm install`.
3. Run `pnpm run dev` to start the development server.


## Making Changes
- Create a feature branch: `git checkout -b feature-name`
- Before submitting a PR, validate with:
  - `pnpm install`
  - `pnpm run guard:nocheck`
  - `pnpm run typecheck`
  - `pnpm run test:all`
  - `pnpm run test:ui` (when touching UI or i18n)
- Format and lint code: `pnpm run lint`

## Submitting a Pull Request
- Create a pull request against the main branch.
- Include a descriptive title and details about your changes.
- Ensure CI checks pass.
