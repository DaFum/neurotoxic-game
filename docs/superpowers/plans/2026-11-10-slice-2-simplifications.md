# Slice 2 Simplifications Implementation Plan: Frontend State Machines & Softlock Eliminators

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the 7 frontend state machine and softlock-elimination simplifications identified in Slice 2 of the Neurotoxic Codebase Simplification Audit.

**Architecture:** Replace scattered multi-boolean permutations and shadow mutable refs across UI scenes and hooks with explicit discriminated unions, making illegal combinations and UI softlocks unrepresentable at compile time while maintaining full backward-compatibility for external consumers.

**Tech Stack:** TypeScript 6.0, React 19, Node.js 22 (`node:test`), Vitest 5.0.

---

### Task 1: Kabelsalat Explicit Phase State Machine (`SUB-08-REC-01`)

**Files:**
- Modify: `src/types/kabelsalat.d.ts:25-35`
- Modify: `src/hooks/minigames/kabelsalat/useKabelsalatState.ts:55-159`
- Modify: `src/hooks/minigames/kabelsalat/useKabelsalatTimer.ts:25-90`
- Modify: `src/hooks/minigames/kabelsalat/useKabelsalatGameEnd.ts:14-95`
- Modify: `src/hooks/minigames/kabelsalat/useKabelsalatVoidSurge.ts:25-60`
- Test: `tests/ui/KabelsalatScene.test.jsx`
- Test: `tests/ui/useKabelsalatState.test.jsx`
- Test: `tests/ui/useKabelsalatGameEnd.test.jsx`

- [x] **Step 1: Check existing test status**
Run: `pnpm exec vitest run tests/ui/KabelsalatScene.test.jsx tests/ui/useKabelsalatState.test.jsx tests/ui/useKabelsalatGameEnd.test.jsx`
Expected: PASS

- [x] **Step 2: Add `KabelsalatPhase` discriminated union to `src/types/kabelsalat.d.ts`**
In `src/types/kabelsalat.d.ts`:
```ts
export type KabelsalatPhase =
  | { name: 'playing' }
  | { name: 'shocked'; reason: string }
  | { name: 'winning' }
  | { name: 'powered' }
  | { name: 'gameover' }
  | { name: 'transitioned' }
```

- [x] **Step 3: Refactor state in `useKabelsalatState.ts`**
In `src/hooks/minigames/kabelsalat/useKabelsalatState.ts`:
- Replace scattered booleans (`isShocked`, `faultReason`, `isPoweredOn`, `isWinning`, `isGameOver`) with `const [phase, setPhase] = useState<KabelsalatPhase>({ name: 'playing' })`.
- Derive backward-compatible boolean getters:
  - `isShocked = phase.name === 'shocked'`
  - `faultReason = phase.name === 'shocked' ? phase.reason : ''`
  - `isWinning = phase.name === 'winning'`
  - `isPoweredOn = phase.name === 'powered'`
  - `isGameOver = phase.name === 'gameover'`
- Provide phase-aware transitions (`triggerShock`, `startWinSequence`, `setGameOver`, `setPoweredOn`).

- [x] **Step 4: Update timer and game end hooks**
In `useKabelsalatTimer.ts`:
- Accept `phase` or phase transition callbacks; prevent timer countdown if `phase.name !== 'playing'`.
In `useKabelsalatVoidSurge.ts`:
- Void surge cannot trigger shock when `phase.name !== 'playing'`.
In `useKabelsalatGameEnd.ts`:
- Trigger end transitions on `phase.name === 'powered'` and `phase.name === 'gameover'`.

- [x] **Step 5: Run tests and typecheck**
Run: `pnpm exec vitest run tests/ui/KabelsalatScene.test.jsx tests/ui/useKabelsalatState.test.jsx tests/ui/useKabelsalatGameEnd.test.jsx`
Run: `pnpm run typecheck:core`
Expected: PASS

---

### Task 2: Post-Gig Modal Flow as a Discriminated Union (`SUB-11-REC-01`)

**Files:**
- Modify: `src/hooks/postGig/usePostGigState.ts:1-50`
- Modify: `src/hooks/postGig/handlers/types.ts:30-50`
- Modify: `src/scenes/PostGig.tsx:105-140`
- Test: `tests/ui/PostGig.component.test.jsx`
- Test: `tests/ui/usePostGigLogic.test.jsx`

- [x] **Step 1: Check existing test status**
Run: `pnpm exec vitest run tests/ui/PostGig.component.test.jsx tests/ui/usePostGigLogic.test.jsx`
Expected: PASS

- [x] **Step 2: Define `PostGigFlowState` in `usePostGigState.ts`**
In `src/hooks/postGig/usePostGigState.ts`:
```ts
export type PostGigFlowState =
  | { phase: 'REPORT' }
  | { phase: 'SOCIAL' }
  | { phase: 'DEALS'; result: PostResult; offers: BrandDeal[] }
  | { phase: 'COMPLETE'; result: PostResult }
```
- Replace separate `[phase]`, `[postResult]`, `[brandOffers]` states with single `flowState: PostGigFlowState` (initial `{ phase: 'REPORT' }`).
- Derive `phase = flowState.phase`, `postResult = 'result' in flowState ? flowState.result : null`, `brandOffers = 'offers' in flowState ? flowState.offers : []`.

- [x] **Step 3: Update `PostGig.tsx` and transitions**
In `src/scenes/PostGig.tsx`:
- Render `CompletePhase` when `phase === 'COMPLETE' && postResult` (now guaranteed by type in `PostGigFlowState`).
- Verify transitions into `DEALS` and `COMPLETE` always carry the validated `PostResult`.

- [x] **Step 4: Run tests and typecheck**
Run: `pnpm exec vitest run tests/ui/PostGig.component.test.jsx tests/ui/usePostGigLogic.test.jsx`
Run: `pnpm run typecheck:core`
Expected: PASS

---

### Task 3: Main Menu Modal Dialogs as a Discriminated Union (`SUB-15-REC-01`)

**Files:**
- Modify: `src/scenes/mainmenu/hooks/useMainMenuState.ts:10-48`
- Modify: `src/scenes/mainmenu/useMainMenu.ts:80-130`
- Modify: `src/scenes/MainMenu.tsx:50-70, 105-115`
- Test: `tests/ui/MainMenu.test.jsx`

- [x] **Step 1: Check existing test status**
Run: `pnpm exec vitest run tests/ui/MainMenu.test.jsx`
Expected: PASS

- [x] **Step 2: Define `MainMenuModal` and consolidate state in `useMainMenuState.ts`**
In `src/scenes/mainmenu/hooks/useMainMenuState.ts`:
```ts
export type MainMenuModal =
  | null
  | { type: 'nameInput' }
  | { type: 'socials' }
  | { type: 'features' }
  | { type: 'existingSave'; target: 'tour' | 'expedition' }
```
- Replace 4 modal booleans with `const [activeModal, setActiveModal] = useState<MainMenuModal>(null)`.
- Derive backward-compatible boolean getters:
  - `showNameInput = activeModal?.type === 'nameInput'`
  - `showSocials = activeModal?.type === 'socials'`
  - `showFeatures = activeModal?.type === 'features'`
  - `showExistingSavePrompt = activeModal?.type === 'existingSave'`

- [x] **Step 3: Remove `promptStartsExpeditionRef` from `useMainMenu.ts`**
In `src/scenes/mainmenu/useMainMenu.ts`:
- Delete `promptStartsExpeditionRef`.
- When starting tour with existing save: `setActiveModal({ type: 'existingSave', target: 'tour' })`.
- When starting expedition with existing save: `setActiveModal({ type: 'existingSave', target: 'expedition' })`.
- In `handleStartNewAnyway`: check `activeModal?.type === 'existingSave' && activeModal.target === 'expedition'` to determine next destination.

- [x] **Step 4: Run tests and typecheck**
Run: `pnpm exec vitest run tests/ui/MainMenu.test.jsx`
Run: `pnpm run typecheck:core`
Expected: PASS

---

### Task 4: Travel Phase State Machine in Overworld Travel (`SUB-10-REC-01`)

**Files:**
- Modify: `src/hooks/travel/types.ts:98-135`
- Modify: `src/hooks/travel/useTravelState.ts:25-55`
- Modify: `src/hooks/travel/actions/useHandleTravel.ts:290-330`
- Modify: `src/hooks/travel/actions/useStartTravelSequence.ts:40-80`
- Modify: `src/hooks/travel/actions/useClearPendingTravel.ts:20-35`
- Test: `tests/node/useTravelLogic.test.js`
- Test: `tests/hooks/travel/useHandleTravel.test.jsx`

- [x] **Step 1: Check existing test status**
Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/useTravelLogic.test.js`
Run: `pnpm exec vitest run tests/hooks/travel/useHandleTravel.test.jsx`
Expected: PASS

- [x] **Step 2: Define `TravelPhase` in `src/hooks/travel/types.ts`**
```ts
export type TravelPhase =
  | { status: 'idle' }
  | {
      status: 'confirming'
      node: MapNode
      toastId: string | null
      timeoutId: ReturnType<typeof setTimeout> | null
    }
  | {
      status: 'traveling'
      targetNodeId: string
      timeoutId: ReturnType<typeof setTimeout> | null
    }
```

- [x] **Step 3: Consolidate state and refs in `useTravelState.ts`**
In `src/hooks/travel/useTravelState.ts`:
- Consolidate `isTraveling`, `pendingTravelNode`, `timeoutRef`, `pendingTimeoutRef`, `pendingToastIdRef` into `const [phase, setPhase] = useState<TravelPhase>({ status: 'idle' })` and a synchronized `const phaseRef = useRef<TravelPhase>(phase)`.
- Derive `isTraveling = phase.status === 'traveling'` and `pendingTravelNode = phase.status === 'confirming' ? phase.node : null`.
- Remove redundant `useLayoutEffect` re-sync bandaid.

- [x] **Step 4: Update travel actions to use `phaseRef`**
In `useClearPendingTravel.ts`, `useHandleTravel.ts`, and `useStartTravelSequence.ts`:
- Clear or transition `phaseRef.current` and update state atomically.

- [x] **Step 5: Run tests and typecheck**
Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/useTravelLogic.test.js`
Run: `pnpm exec vitest run tests/hooks/travel/useHandleTravel.test.jsx`
Run: `pnpm run typecheck:core`
Expected: PASS

---

### Task 5: GigInitStatus Discriminated Union in Rhythm Game (`SUB-07-REC-02`)

**Files:**
- Modify: `src/types/gigAudioStatus.ts:1-10`
- Modify: `src/hooks/rhythmGame/useRhythmGameState.ts:40-50, 130-195`
- Modify: `src/hooks/rhythmGame/useRhythmGameAudio.ts:415-420, 505-520`
- Modify: `src/scenes/Gig.tsx:135-145`
- Test: `tests/ui/useRhythmGameState.test.jsx`
- Test: `tests/ui/useRhythmGameAudio.test.jsx`
- Test: `tests/ui/Gig.scene.test.jsx`

- [x] **Step 1: Check existing test status**
Run: `pnpm exec vitest run tests/ui/useRhythmGameState.test.jsx tests/ui/useRhythmGameAudio.test.jsx tests/ui/Gig.scene.test.jsx`
Expected: PASS

- [x] **Step 2: Define `GigInitStatus` in `src/types/gigAudioStatus.ts`**
In `src/types/gigAudioStatus.ts`:
```ts
export type GigInitStatus =
  | { status: 'idle' }
  | { status: 'initializing' }
  | { status: 'ready' }
  | { status: 'blocked' }
  | { status: 'failed'; failureKind: GigFailureKind }
```

- [x] **Step 3: Consolidate state in `useRhythmGameState.ts`**
In `src/hooks/rhythmGame/useRhythmGameState.ts`:
- Add `initStatus: GigInitStatus` to `RhythmUiState` (default `{ status: 'idle' }`).
- Derive `audioStatus = state.initStatus.status` and `failureKind = state.initStatus.status === 'failed' ? state.initStatus.failureKind : null` (or keep them updated synchronously in reducer).
- Add action `SET_INIT_STATUS` (setting `{ status, failureKind? }` in one dispatch).

- [x] **Step 4: Update `useRhythmGameAudio.ts` and `Gig.tsx`**
In `useRhythmGameAudio.ts`:
- Dispatch `SET_INIT_STATUS` instead of separate `SET_AUDIO_STATUS` and `SET_FAILURE_KIND`.

- [x] **Step 5: Run tests and typecheck**
Run: `pnpm exec vitest run tests/ui/useRhythmGameState.test.jsx tests/ui/useRhythmGameAudio.test.jsx tests/ui/Gig.scene.test.jsx`
Run: `pnpm run typecheck:core`
Expected: PASS

---

### Task 6: LeaderboardState Discriminated Union in LeaderboardTab (`SUB-13-REC-01`)

**Files:**
- Modify: `src/ui/bandhq/leaderboard/types.ts:1-20`
- Modify: `src/ui/bandhq/leaderboard/LeaderboardTab.tsx:40-60, 90-155, 205-220`
- Modify: `src/ui/bandhq/leaderboard/components/LeaderboardTable.tsx:5-55`
- Test: `tests/ui/bandhq/leaderboard/LeaderboardTab.test.jsx`

- [ ] **Step 1: Check existing test status**
Run: `pnpm exec vitest run tests/ui/bandhq/leaderboard/LeaderboardTab.test.jsx`
Expected: PASS

- [ ] **Step 2: Define `LeaderboardState` in `src/ui/bandhq/leaderboard/types.ts`**
In `src/ui/bandhq/leaderboard/types.ts`:
```ts
export type LeaderboardState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'unavailable' }
  | { status: 'ready'; entries: LeaderboardEntry[] }
```

- [ ] **Step 3: Consolidate state in `LeaderboardTab.tsx`**
In `src/ui/bandhq/leaderboard/LeaderboardTab.tsx`:
- Replace `[rankings]`, `[isLoading]`, `[error]`, `[isUnavailable]` with `const [state, setState] = useState<LeaderboardState>({ status: 'loading' })`.
- On fetch start: `setState({ status: 'loading' })`.
- On fetch success: `setState({ status: 'ready', entries: sanitizedEntries })`.
- On 404: `setState({ status: 'unavailable' })`.
- On fetch failure: `setState({ status: 'error', message: t('ui:leaderboard.load_error') })`.

- [ ] **Step 4: Update `LeaderboardTable.tsx`**
In `src/ui/bandhq/leaderboard/components/LeaderboardTable.tsx`:
- Accept `state: LeaderboardState` (with derived fallbacks for existing props if needed).
- Match directly on `state.status`: `'loading'`, `'error'`, `'unavailable'`, `'ready'`.

- [ ] **Step 5: Run tests and typecheck**
Run: `pnpm exec vitest run tests/ui/bandhq/leaderboard/LeaderboardTab.test.jsx`
Run: `pnpm run typecheck:core`
Expected: PASS

---

### Task 7: Discriminated Purchase Decision State Model (`SUB-12-REC-01`)

**Files:**
- Modify: `src/types/purchase.d.ts:15-30`
- Modify: `src/utils/purchaseLogicUtils.ts:390-455`
- Modify: `src/ui/bandhq/ShopItem.tsx:70-90`
- Test: `tests/ui/ShopTab.test.jsx`
- Test: `tests/node/usePurchaseLogic.test.js`

- [ ] **Step 1: Check existing test status**
Run: `pnpm exec vitest run tests/ui/ShopTab.test.jsx`
Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/usePurchaseLogic.test.js`
Expected: PASS

- [ ] **Step 2: Add `PurchaseStatus` to `src/types/purchase.d.ts`**
In `src/types/purchase.d.ts`:
```ts
export type PurchaseStatus =
  | 'available'
  | 'owned'
  | 'insufficient_funds'
  | 'reputation_blocked'
  | 'missing_effect'

export interface PurchaseDecision {
  cost: number
  status: PurchaseStatus
  canAfford: boolean
  isOwned: boolean
  isConsumable: boolean
  canPurchase: boolean
}
```

- [ ] **Step 3: Update `derivePurchaseDecision` in `src/utils/purchaseLogicUtils.ts`**
In `src/utils/purchaseLogicUtils.ts`:
- Determine exact `status: PurchaseStatus`:
  - If `!hasValidEffect` -> `'missing_effect'`
  - Else if `isOwned && !isConsumable` -> `'owned'`
  - Else if `!meetsReputation` -> `'reputation_blocked'`
  - Else if `!playerCanAfford` -> `'insufficient_funds'`
  - Else -> `'available'`
- Set `canPurchase = status === 'available'`.

- [ ] **Step 4: Update `ShopItem.tsx` disabled reason**
In `src/ui/bandhq/ShopItem.tsx`:
- Use `decision?.status === 'reputation_blocked'` to show `ui:shop.messages.reputationBlocked` (with sensible fallback "Reputation too controversial.").
- When `decision?.status === 'insufficient_funds'` or (`!decision?.canPurchase && isDisabled`), show `ui:shop.messages.notEnough`.

- [ ] **Step 5: Run tests and typecheck**
Run: `pnpm exec vitest run tests/ui/ShopTab.test.jsx`
Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/usePurchaseLogic.test.js`
Run: `pnpm run typecheck:core`
Expected: PASS

---

### Step-by-Step Verification Gate for All Slice 2 Tasks

Upon completion of Tasks 1 through 7:
- Fast tests: `pnpm run test`
- Core typecheck: `pnpm run typecheck:core`
- Server typecheck: `pnpm run typecheck:server`
- Dead code check: `pnpm run deadcode:check`
- Git status check: `git status`
