# Slice 1 Simplifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the 6 zero-blast-radius, high-impact simplification opportunities identified in Slice 1 of the Neurotoxic Codebase Simplification Audit.

**Architecture:** Each task operates on isolated local files with non-overlapping boundaries, eliminating redundant type unions, imperative switch ladders, fragmented state containers, and pseudo-entities without changing external behavior or introducing speculative abstractions.

**Tech Stack:** TypeScript 6.0, React 19, Node.js 22 (`node:test`), Vitest 5.0, Tone.js.

---

### Task 1: Declarative SFX Recipe Table with Derived Union (`SUB-06-REC-01`)

**Files:**
- Modify: `src/utils/audio/sfx.ts:1-100`
- Modify: `src/utils/audio/AudioManager.ts:25-105, 340-355`
- Test: `tests/node/audioManager.test.js`

- [x] **Step 1: Check existing test status**
Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/audioManager.test.js`
Expected: PASS

- [x] **Step 2: Add test asserting declarative SFX recipe execution and validation**
In `tests/node/audioManager.test.js`, add a test verifying all known SFX types trigger without warning and that an unknown SFX type is rejected with a single warning:
```js
test('playSFX executes valid recipes and warns on unknown type', () => {
  const manager = new AudioManager()
  // Valid sound effect
  manager.playSFX('hit')
  // Unknown sound effect should log warning and return without throw
  manager.playSFX('nonexistent_sfx')
})
```

- [x] **Step 3: Define `SFX_RECIPES` and derive `AudioSfxType` in `src/utils/audio/sfx.ts`**
In `src/utils/audio/sfx.ts`:
```ts
export interface SfxTrigger {
  readonly note: string
  readonly dur: string
  readonly offsetSec?: number
  readonly vel?: number
  readonly voice?: 'synth' | 'kick'
}

export const SFX_RECIPES = {
  hit: [{ note: 'A5', dur: '16n' }],
  miss: [{ note: 'D2', dur: '8n' }],
  menu: [{ note: 'C5', dur: '32n', vel: 0.3 }],
  travel: [{ note: 'C1', dur: '8n', vel: 0.5, voice: 'kick' }],
  cash: [
    { note: 'B5', dur: '16n', vel: 0.4 },
    { note: 'E6', dur: '16n', offsetSec: 0.05, vel: 0.4 }
  ],
  crash: [
    { note: 'C1', dur: '8n', vel: 1.0 },
    { note: 'F1', dur: '8n', offsetSec: 0.02, vel: 0.8 }
  ],
  honk: [
    { note: 'F#4', dur: '8n', vel: 0.6 },
    { note: 'A4', dur: '8n', vel: 0.6 }
  ],
  pickup: [
    { note: 'C5', dur: '32n', vel: 0.5 },
    { note: 'E5', dur: '32n', offsetSec: 0.05, vel: 0.5 }
  ],
  deliver: [
    { note: 'C2', dur: '4n', vel: 0.8 },
    { note: 'G2', dur: '4n', vel: 0.6 }
  ],
  void_hit: [
    { note: 'B1', dur: '8n', vel: 0.9 },
    { note: 'F2', dur: '8n', offsetSec: 0.03, vel: 0.7 },
    { note: 'C#2', dur: '16n', offsetSec: 0.06, vel: 0.5 }
  ]
} as const satisfies Record<string, readonly SfxTrigger[]>

export type AudioSfxType = keyof typeof SFX_RECIPES
```
Replace the 56-line `switch (type)` with declarative iteration over `SFX_RECIPES[type]`. Preserve the travel kick fallback (`audioState.drumKit?.kick ? kick C1 : synth G1`).

- [x] **Step 4: Update `AudioManager.ts` to derive from `sfx.ts`**
In `src/utils/audio/AudioManager.ts`:
- Import `type AudioSfxType`, `SFX_RECIPES` from `./sfx`.
- Remove the manually declared `AudioSfxType` union and `VALID_SFX_TYPES` Set.
- Simplify `playSFX(key: AudioSfxType | string)`: validate `Object.hasOwn(SFX_RECIPES, key)`, logging once if unknown and delegating to `playSFX(key)`.

- [x] **Step 5: Run tests and typecheck**
Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/audioManager.test.js`
Run: `pnpm run typecheck:core`
Expected: PASS

---

### Task 2: Consume `LoadPreviewResult` Directly in GameOver (`SUB-15-REC-02`)

**Files:**
- Modify: `src/scenes/GameOver.tsx:18-75`
- Modify: `src/scenes/gameover/GameOverButtons.tsx:8-95`
- Test: `tests/ui/GameOver.test.jsx`

- [x] **Step 1: Check existing test status**
Run: `pnpm exec vitest run tests/ui/GameOver.test.jsx`
Expected: PASS

- [x] **Step 2: Update `GameOverButtons.tsx` to accept `LoadPreviewResult | { status: 'pending' }`**
In `src/scenes/gameover/GameOverButtons.tsx`:
- Import `type LoadPreviewResult` from `../../types`.
- Replace `GameOverLoadAvailability` with:
```ts
export type GameOverSavePreview = LoadPreviewResult | { status: 'pending' }
```
- Replace `loadAvailability` prop with `savePreview: GameOverSavePreview`.
- Replace `typeof loadAvailability === 'object'` and `'available'/'ending'` checks with:
  - `savePreview.status === 'resumable'` -> render retry button
  - `savePreview.status === 'terminal'` -> render lastSaveIsEnding message
  - `savePreview.status === 'unavailable'` -> render refusal message with `savePreview.reason`

- [x] **Step 3: Update `GameOver.tsx` and delete `toLoadAvailability`**
In `src/scenes/GameOver.tsx`:
- Delete `toLoadAvailability` function (lines 18–28).
- Store `savePreview: GameOverSavePreview` in state (initial `{ status: 'pending' }`).
- In `handleRetry`, evaluate `previewLoadGame()`: if `preview.status === 'resumable'`, proceed to load.
- Pass `savePreview` to `<GameOverButtons />`.

- [x] **Step 4: Run tests and typecheck**
Run: `pnpm exec vitest run tests/ui/GameOver.test.jsx`
Run: `pnpm run typecheck:core`
Expected: PASS

---

### Task 3: Vector Movement Interface in Roadie Controls (`SUB-09-REC-02`)

**Files:**
- Modify: `src/types/components.d.ts:60-70`
- Modify: `src/components/minigames/roadie/RoadieControls.tsx:10-65`
- Modify: `src/components/minigames/roadie/RoadieTouchSurface.tsx:10-100`
- Modify: `src/components/minigames/roadie/RoadieDPad.tsx:1-65`
- Modify: `src/scenes/RoadieRunScene.tsx:48-60`
- Test: `tests/ui/RoadieControls.test.jsx`
- Test: `tests/ui/RoadieRunScene.test.jsx`

- [x] **Step 1: Check existing test status**
Run: `pnpm exec vitest run tests/ui/RoadieControls.test.jsx tests/ui/RoadieRunScene.test.jsx`
Expected: PASS

- [x] **Step 2: Update `RoadieControlsProps` in `src/types/components.d.ts`**
Replace lines 60–67 of `src/types/components.d.ts`:
```ts
export interface RoadieControlsProps {
  showControls: boolean
  setShowControls: React.Dispatch<React.SetStateAction<boolean>>
  onMove: (dx: number, dy: number) => void
}
```

- [x] **Step 3: Simplify `RoadieTouchSurface.tsx` and `RoadieDPad.tsx`**
In `src/components/minigames/roadie/RoadieTouchSurface.tsx`:
- Accept `onMove: (dx: number, dy: number) => void`.
- Delete `triggerMove` (lines 32–45) and its 4-way `if/else` ladder.
- Replace calls with `onMove(deltaX > 0 ? 1 : -1, 0)` or `onMove(0, deltaY > 0 ? 1 : -1)`.

In `src/components/minigames/roadie/RoadieDPad.tsx`:
- Accept `onMove: (dx: number, dy: number) => void`.
- Button callbacks call `onMove(0, -1)`, `onMove(-1, 0)`, `onMove(0, 1)`, and `onMove(1, 0)`.

In `src/components/minigames/roadie/RoadieControls.tsx`:
- Forward `onMove` to `RoadieTouchSurface` and `RoadieDPad`.

- [x] **Step 4: Simplify `RoadieRunScene.tsx`**
In `src/scenes/RoadieRunScene.tsx`:
- Remove `handleMoveUp`, `handleMoveLeft`, `handleMoveDown`, `handleMoveRight` `useCallback`s (lines 50–53).
- Pass `onMove={actions.move}` to `<RoadieControls />`.

- [x] **Step 5: Update tests and verify**
In `tests/ui/RoadieControls.test.jsx`, update test harness to supply `onMove = vi.fn()` and assert `expect(onMove).toHaveBeenCalledWith(dx, dy)`.
Run: `pnpm exec vitest run tests/ui/RoadieControls.test.jsx tests/ui/RoadieRunScene.test.jsx`
Run: `pnpm run typecheck:core`
Expected: PASS

---

### Task 4: Atomic Press-and-Hold Session State in Gamepad Input (`SUB-16-REC-01`)

**Files:**
- Modify: `src/context/GamepadInputContext.tsx:70-90, 155-175, 275-295`
- Test: `tests/ui/gamepadHold.test.jsx`
- Test: `tests/ui/gamepadProvider.test.jsx`

- [x] **Step 1: Check existing test status**
Run: `pnpm exec vitest run tests/ui/gamepadHold.test.jsx tests/ui/gamepadProvider.test.jsx`
Expected: PASS

- [x] **Step 2: Consolidate `activeHoldRef` in `src/context/GamepadInputContext.tsx`**
In `src/context/GamepadInputContext.tsx`:
- Define internal type:
```ts
type ActiveHoldSession = {
  element: HTMLElement
  scope: HTMLElement | null
  stop: () => void
}
```
- Replace `activeHoldScopeRef` and `activeHoldElementRef` with:
```ts
const activeHoldRef = useRef<ActiveHoldSession | null>(null)
```
- Add helper:
```ts
const cancelActiveHold = () => {
  if (!activeHoldRef.current) return
  activeHoldRef.current.stop()
  activeHoldRef.current = null
}
```
- In `confirm(scope)`: on `activateGamepadElement(element)` returning `stop`, set `activeHoldRef.current = { element: element as HTMLElement, scope: scope[0] ?? null, stop }`. (Do not store `stop` in `releasesRef`).
- In `route(button, pressed)`: when `!pressed && button === GAMEPAD_BUTTON.SOUTH`, call `cancelActiveHold()`.
- In `poll()`: when focus or scope diverges (`activeHoldRef.current && (activeHoldRef.current.scope !== scope[0] || document.activeElement !== activeHoldRef.current.element)`), call `cancelActiveHold()`.
- In `reset()`: call `cancelActiveHold()`.

- [x] **Step 3: Run tests and typecheck**
Run: `pnpm exec vitest run tests/ui/gamepadHold.test.jsx tests/ui/gamepadProvider.test.jsx`
Run: `pnpm run typecheck:core`
Expected: PASS

---

### Task 5: Shared Leaderboard Contracts and Response Unions (`SUB-18-REC-01`)

**Files:**
- Modify: `src/types/leaderboard.d.ts:1-25`
- Modify: `src/utils/leaderboardSyncController.ts:345-375`
- Modify: `src/ui/bandhq/leaderboard/LeaderboardTab.tsx:105-140`
- Test: `tests/api/leaderboard.stats.test.js`
- Test: `tests/api/leaderboard.song.test.js`

- [x] **Step 1: Check existing test status**
Run: `pnpm exec vitest run tests/api/leaderboard.stats.test.js tests/api/leaderboard.song.test.js`
Expected: PASS

- [x] **Step 2: Add shared types to `src/types/leaderboard.d.ts`**
In `src/types/leaderboard.d.ts`:
```ts
export type LeaderboardStatsPayload = {
  playerId: string
  playerName: string
  money: number
  fame: number
  followers: number
  distance: number
  conflicts: number
  stageDives: number
  day?: number
  revision?: number
}

export type LeaderboardStatsSyncResult =
  | { success: true; stale?: false }
  | { success: true; stale: true; revision: number }

export interface LeaderboardEntry {
  rank: number
  playerRef: string
  playerName: string
  score: number
}

export interface LeaderboardSongScoreItem {
  songId: string
  score: number
}

export interface LeaderboardSongBatchPayload {
  playerId: string
  playerName: string
  scores: LeaderboardSongScoreItem[]
}
```

- [x] **Step 3: Narrow response handling in `src/utils/leaderboardSyncController.ts`**
In `src/utils/leaderboardSyncController.ts`:
- Import `LeaderboardStatsSyncResult`.
- Narrow the json response: `const body = (await response.json()) as LeaderboardStatsSyncResult`.
- If `body.stale === true`, read `body.revision` directly without ad-hoc casting or redundant `Object.hasOwn` checks.

- [x] **Step 4: Type sanitized entries in `src/ui/bandhq/leaderboard/LeaderboardTab.tsx`**
In `src/ui/bandhq/leaderboard/LeaderboardTab.tsx`:
- Use `LeaderboardEntry` directly instead of ad-hoc cast records.

- [x] **Step 5: Run tests and typecheck**
Run: `pnpm exec vitest run tests/api/leaderboard.stats.test.js tests/api/leaderboard.song.test.js`
Run: `pnpm run typecheck:core`
Run: `pnpm run typecheck:server`
Expected: PASS

---

### Task 6: Decouple Clinic Cyber-Graft Traits from Band Character Registry (`SUB-19-REC-02`)

**Files:**
- Modify: `src/types/npc.d.ts:1-25`
- Modify: `src/data/characters.ts:140-188`
- Modify: `src/utils/traitUtils.ts:120-135`
- Modify: `src/ui/bandhq/detailedStats/helpers.ts:18-30`
- Test: `tests/node/clinicLogic.test.js`
- Test: `tests/node/neuroOverclock.test.js`
- Test: `tests/ui/ClinicScene.test.jsx`

- [x] **Step 1: Check existing test status**
Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/clinicLogic.test.js tests/node/neuroOverclock.test.js`
Run: `pnpm exec vitest run tests/ui/ClinicScene.test.jsx`
Expected: PASS

- [x] **Step 2: Extend `CharacterTrait` in `src/types/npc.d.ts`**
In `src/types/npc.d.ts`, add structured `effects?: Record<string, unknown>` to `CharacterTrait`:
```ts
export interface CharacterTrait {
  id: string
  name: string
  desc: string
  unlockHint: string
  effect?: string
  effects?: {
    rhythmMultiplier?: number
    stressPerGig?: number
    staminaPerGig?: number
    [key: string]: unknown
  }
  exclusiveWith?: string[]
}
```

- [x] **Step 3: Extract `CLINIC_TRAITS` in `src/data/characters.ts` and remove `CLINIC` from `CHARACTERS`**
In `src/data/characters.ts`:
- Export `CLINIC_TRAITS: CharacterTrait[]` containing `cyber_lungs`, `iron_liver`, and `neuro_overclock`.
- Remove `CLINIC` from `CHARACTERS`. `CHARACTERS` now contains only `MATZE`, `MARIUS`, `LARS`.

- [x] **Step 4: Register `CLINIC_TRAITS` in `src/utils/traitUtils.ts` and simplify `helpers.ts`**
In `src/utils/traitUtils.ts`:
- Import `CLINIC_TRAITS` from `../data/characters`.
- In `TRAIT_DEFS_BY_ID` initialization, register `CLINIC_TRAITS` along with member traits.
In `src/ui/bandhq/detailedStats/helpers.ts`:
- Remove `if (c.name && c.role !== 'NPC')` check; since `CHARACTERS` contains only real members, map directly.

- [x] **Step 5: Run tests and typecheck**
Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/clinicLogic.test.js tests/node/neuroOverclock.test.js`
Run: `pnpm exec vitest run tests/ui/ClinicScene.test.jsx`
Run: `pnpm run typecheck:core`
Expected: PASS

---

### Step-by-Step Verification Gate for All Slice 1 Tasks

Upon completion of Tasks 1 through 6:
- Fast tests: `pnpm run test`
- Core typecheck: `pnpm run typecheck:core`
- Server typecheck: `pnpm run typecheck:server`
- Dead code check: `pnpm run deadcode:check`
- Git status check: `git status`
