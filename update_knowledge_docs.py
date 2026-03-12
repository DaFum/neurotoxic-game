import os

knowledge_base = """
### 🏗️ Architecture: React, UI, & Styling
* **React 19 / Refs:** Pass `ref` as a standard prop and destructure it directly from props (do not use `React.forwardRef()`).
* **Component Optimization:** Wrap static UI blocks/icons in `React.memo()`. Rely on shallow comparison and stable references (`useMemo`/`useCallback`). Avoid custom equality comparators.
* **Event Handlers & `cloneElement`:** Wrap handlers in `useCallback`. Wrap disabled children in `<span tabIndex={0}>` so they can receive keyboard focus.
* **Structural Components:** Expose `contentClassName` for internal flex constraints (like `flex-1 min-h-0`) instead of hardcoding spacing.
* **CSS / Flexbox:** Chain `flex-1 min-h-0 flex flex-col` for internal scrolling.
* **Tailwind v4:** Use `bg-(--color)`. Avoid aggressive regex replacements that strip `var()`. Tokenize class strings (`.split(' ')`) instead of direct `.includes()` for dynamic utility checks.
* **UI Accessibility:** Wrap icon-only buttons in `Tooltip` components with `aria-label`s.
* **Shop / Consumables UI:** Consumables use the `inventory_add` effect and should not display as 'OWNED' to allow multi-purchase.
* **UX & State Consistency:** Success toasts for bounded state changes must display the actual applied delta.

### ⚙️ Architecture: Data, State, & JS Fundamentals
* **State Safety (NEUROTOXIC):** Resources must never be negative (`player.money`/`fame` >= 0; `band.harmony` 1-100). Enforce boundary checks.
* **Redux / State Mutability:** ONLY use Action Creators. NEVER call reducers directly.
* **State Derivation:** Pre-calculate bounded values into a local variable before assigning to state for better readability.
* **Data Access:** Prefer $O(1)$ lookups via pre-computed Maps (e.g., `SONGS_BY_ID`) over $O(N)$ array searches.
* **Data Schemas:** `hqItems.js` uses a singular `effect` object. `events/special.js` events require unique IDs, category 'special', i18n keys (`events:`), and an `options` array.
* **ES2022 & Performance:** Use `Object.hasOwn()`. Use `for...in` + `Object.hasOwn()` over `Object.keys().reduce()` to avoid array allocations. Combine nested `if`s with `&&`.
* **Localization:** Use `t('key')` for ALL text. Follow AGENTS.md prefixes (e.g., `ui:`). Include `t` in React hook dependencies.

### 🧪 Testing & Mocks
* **Framework Configuration:** `node:test` for `.js` logic/data. `vitest` exclusively for `.jsx` React/UI components.
* **Testing React Hooks:** Vitest is strictly for hooks; extract pure logic if using `node:test`.
* **Mocking:**
  * Explicitly populate lookup Maps in mocked data.
  * Mocks for structural components (`vi.mock`) must replicate core DOM hierarchy and forward layout props.
  * Mock `window.localStorage.setItem` in Vitest, wrapped in `try/finally` for cleanup.
  * For `react-i18next`, include `initReactI18next: { type: '3rdParty', init: () => {} }`.
* **Security & Prototypes:** Use `Object.hasOwn(obj, '__proto__')` to check for stripped forbidden keys.
* **CLI Execution:** Single logic test: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs <filepath>`.

### 🌍 Environment, Setup, & Tooling
* **Package Management:** Use `pnpm` exclusively (`dev`, `build`, `test`, `test:ui`, `test:all`, `lint`, `format`).
* **Dependencies (LOCKED):** React 19.2.4, Vite 7.3.1, Tailwind 4.2.0, Framer Motion 12.35.1, Tone.js 15.5.6. Node.js 22.13+. Do NOT use Howler.js.
* **Node.js Scripts:** Ad-hoc scripts using `require()` must end in `.cjs`. Use CLI tools (`sed`, `awk`) for JSX refactoring instead of `@babel/core`.
* **Environment Variables:** Maintain `.env.example`. Use `process.env.VITE_VAR` for Vite/node:test dual compatibility.
* **Linting / Coverage:** Use `@eslint-react/eslint-plugin`. Ignore `Songs.js` in ESLint. Add `coverage/` to `.gitignore`.
* **Pollinations API:** The key is safe to publish.

### 📋 Workflow, PRs, & Planning Constraints
* **Planning / Pre-Commit Rules:** Use concrete, actionable tool-call steps. The pre-commit step must immediately precede the final submission with the exact phrasing: "Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done." Run full test suite (`pnpm run test:all`) before this step.
* **PR Formatting Rules:** Ensure Conventional Commits format. Use strict prefixes and sections based on type (🧪 Testing, 🧹 Code Health, ⚡ Performance, 🔒 Security).
* **PR Noise Management:** Prefer targeted CLI refactoring (e.g., `sed -i`) over global formatting to minimize noise.
* **Verification Rules:** Always verify fixes, remove temporary verification files, and ensure `frontend_verification_complete` screenshots exist on disk.
* **Agent Context:** Use Context7 MCP for documentation and setup generation automatically.
"""

files_to_update = [
    ".github/copilot-instructions.md",
    "AGENTS.md",
    "CLAUDE.md"
]

for filepath in files_to_update:
    if os.path.exists(filepath):
        with open(filepath, "a", encoding="utf-8") as file:
            file.write("\n## Extended Knowledge Base\n" + knowledge_base)
        print(f"Appended knowledge base to {filepath}")
    else:
        print(f"Warning: File not found {filepath}")
