# tsconfig Deep-Dive

## This Project's Config

```json
{
  "strict": true,           // enables all strict checks below
  "strictNullChecks": true, // null/undefined are not assignable to other types
  "noImplicitAny": true,    // error on inferred `any`
  "noEmit": true,           // type-check only; Vite handles transpilation
  "isolatedModules": true,  // each file must be independently transpilable (Vite/esbuild requirement)
  "moduleResolution": "bundler", // modern resolution matching Vite's behavior
  "allowJs": true,          // JS files included in type checking
  "checkJs": true           // type errors reported in JS files too
}
```

## Key `strict` Sub-Flags

| Flag | What it catches |
|---|---|
| `strictNullChecks` | `null`/`undefined` not assignable without explicit union |
| `noImplicitAny` | Parameters/variables without inferable type |
| `strictFunctionTypes` | Contravariant function parameter checking |
| `strictPropertyInitialization` | Class properties must be initialized in constructor |
| `strictBindCallApply` | Type-safe `.bind()`, `.call()`, `.apply()` |
| `useUnknownInCatchVariables` | `catch (e)` binds `e` as `unknown`, not `any` |

## `isolatedModules` Constraints

Because Vite uses esbuild (single-file transpilation), each file must be self-contained:

- **No `const enum`** — use regular `enum` or string union types instead
- **Type-only imports must use `import type`** — ensures they're erased at compile time:

```ts
// Good
import type { GameState } from '../types/game'
import { type SceneName, getScene } from '../scenes'

// Bad — may cause runtime errors with isolatedModules
import { GameState } from '../types/game'  // if GameState is type-only
```

## Path Aliases

```json
"paths": { "@/*": ["src/*"] }
```

Usage: `import { clamp } from '@/utils/gameStateUtils'`

Both `tsconfig.json` (for tsc) and `vite.config.js` (for bundler resolution) must agree on aliases.

## `noEmit` + Vite Split

TypeScript only type-checks; it never emits JS. Vite handles transpilation independently via esbuild. This means:

- Run `pnpm run typecheck` for type errors
- Run `pnpm run build` for bundling
- They are independent — build can succeed while typecheck fails

## Common tsconfig Pitfalls

| Problem | Cause | Fix |
|---|---|---|
| `Cannot find module '@/...'` in tests | `paths` not in vitest config | Add `resolve.alias` to `vitest.config.js` |
| `const enum` errors | `isolatedModules: true` | Use regular `enum` or string union |
| `.js` import not resolved | `moduleResolution` mismatch | Use `"bundler"` to match Vite |
| Type errors in `node_modules` | `skipLibCheck: false` | Set `skipLibCheck: true` |
| Class field init errors | `useDefineForClassFields: true` | Initialize in constructor or use `!` assertion |

## Useful CLI Flags

```bash
# Type-check without emitting
pnpm run typecheck
# = tsc --noEmit

# Check a single file (shows errors with line numbers)
npx tsc --noEmit --pretty src/utils/gameStateUtils.ts

# Show all errors including deep dependencies
npx tsc --noEmit 2>&1 | head -50
```
