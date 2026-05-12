# Scene Export and Registry Report

This document outlines the current state of scene exports, registry, validation, and routing within the codebase.

## 1. Scene Component Files and Export Styles

All main scene component files are located in the `src/scenes/` directory. An analysis of these files shows that **all of them currently use both named and default exports**.

| File Path | Export Style |
| :--- | :--- |
| `src/scenes/AmpCalibrationScene.tsx` | Both (named & default) |
| `src/scenes/ClinicScene.tsx` | Both (named & default) |
| `src/scenes/Credits.tsx` | Both (named & default) |
| `src/scenes/GameOver.tsx` | Both (named & default) |
| `src/scenes/Gig.tsx` | Both (named & default) |
| `src/scenes/IntroVideo.tsx` | Both (named & default) |
| `src/scenes/KabelsalatScene.tsx` | Both (named & default) |
| `src/scenes/MainMenu.tsx` | Both (named & default) |
| `src/scenes/Overworld.tsx` | Both (named & default) |
| `src/scenes/PostGig.tsx` | Both (named & default) |
| `src/scenes/PreGig.tsx` | Both (named & default) |
| `src/scenes/RoadieRunScene.tsx` | Both (named & default) |
| `src/scenes/Settings.tsx` | Both (named & default) |
| `src/scenes/TourbusScene.tsx` | Both (named & default) |

*(Note: Memory explicitly states: "Architecture (Scenes): Use named exports exclusively for Scene components in 'src/scenes/'. When using React lazy loading, import them via the '.then(m => ({ default: m.SceneName }))' mapping pattern to avoid default export resolution issues." This rule is currently being violated by having both named and default exports and the way routing is implemented.)*

## 2. Scene Registry and Game Constants

The central registry of scenes and related constants is located in `src/context/gameConstants.ts`.

### `GAME_PHASES`
The single canonical source of truth for valid scenes:
```typescript
export const GAME_PHASES = Object.freeze({
  OVERWORLD: 'OVERWORLD',
  TRAVEL_MINIGAME: 'TRAVEL_MINIGAME',
  PRE_GIG: 'PREGIG',
  PRE_GIG_MINIGAME: 'PRE_GIG_MINIGAME',
  GIG: 'GIG',
  POST_GIG: 'POSTGIG',
  PRACTICE: 'PRACTICE',
  MENU: 'MENU',
  SETTINGS: 'SETTINGS',
  CREDITS: 'CREDITS',
  GAMEOVER: 'GAMEOVER',
  INTRO: 'INTRO',
  CLINIC: 'CLINIC'
} as const satisfies Record<string, string>)
```

### `ALLOWED_SCENE_VALUES`
Derives from `GAME_PHASES`:
```typescript
export const ALLOWED_SCENE_VALUES = Object.freeze(
  Object.values(GAME_PHASES) as GamePhase[]
)
```

### `MINIGAME_TYPES`
```typescript
export const MINIGAME_TYPES = {
  TOURBUS: 'TOURBUS',
  ROADIE: 'ROADIE',
  KABELSALAT: 'KABELSALAT',
  AMP_CALIBRATION: 'AMP_CALIBRATION'
}
```

### `PRACTICE_RETURN_SCENES`
```typescript
export const PRACTICE_RETURN_SCENES = new Set<GamePhase>([
  GAME_PHASES.OVERWORLD,
  GAME_PHASES.MENU
])
```

## 3. Scene Transition Validation (`CHANGE_SCENE`)

Scene changes are managed and validated primarily in `src/context/reducers/sceneReducer.ts`, triggered by the `CHANGE_SCENE` action in the reducer map (`src/context/gameReducer.ts`).

In `sceneReducer.ts`, a strict validation occurs against `ALLOWED_SCENE_SET` (which is instantiated from `ALLOWED_SCENE_VALUES`, the source of truth):
```typescript
const ALLOWED_SCENE_SET: ReadonlySet<string> = new Set(ALLOWED_SCENE_VALUES)

export const isValidGamePhase = (value: string): value is GamePhase => {
  return ALLOWED_SCENE_SET.has(value)
}

export const handleChangeScene = (
  state: GameState,
  payload: string
): GameState => {
  if (!isValidGamePhase(payload)) {
    logger.warn(
      'GameState',
      `Invalid scene transition ignored: ${state.currentScene} -> ${payload}`
    )
    return state
  }

  logger.info('GameState', `Scene Change: ${state.currentScene} -> ${payload}`)
  return { ...state, currentScene: payload }
}
```

However, `src/context/reducers/systemReducer.ts` also contains its own defined subset of allowed scenes, which can be seen as an antipattern according to the memory rules ("Avoid creating separate or parallel scene allow-lists across reducers"):
```typescript
export const ALLOWED_SCENES = new Set([
  GAME_PHASES.OVERWORLD,
  GAME_PHASES.PRE_GIG,
  GAME_PHASES.GIG,
  GAME_PHASES.PRACTICE,
  GAME_PHASES.POST_GIG,
  GAME_PHASES.TRAVEL_MINIGAME,
  GAME_PHASES.PRE_GIG_MINIGAME,
  GAME_PHASES.GAMEOVER,
  GAME_PHASES.CLINIC
])
```

## 4. Scene Routing and Mapping

Scenes are imported and mapped dynamically in `src/components/SceneRouter.tsx`.

The `SceneRouter` utilizes React's `lazy` to dynamically import scene components. Currently, it relies on resolving the **default export** from the scene files, for example:
```typescript
const ClinicScene = lazy(() => import('../scenes/ClinicScene.tsx'))
const Overworld = lazy(() => import('../scenes/Overworld.tsx'))
// ...
```

The router itself uses a `switch` statement mapped directly to the `GAME_PHASES` enumeration to dictate which scene component to render. It also accommodates minigames through a sub-routing check based on the `minigameType` prop:
```typescript
export function SceneRouter({ currentScene, minigameType }: SceneRouterProps) {
  switch (currentScene) {
    case GAME_PHASES.INTRO:
      return <IntroVideo />
    case GAME_PHASES.MENU:
      return <MainMenu />
    // ...
    case GAME_PHASES.PRE_GIG_MINIGAME:
      if (minigameType === MINIGAME_TYPES.KABELSALAT) {
        return <KabelsalatScene />
      }
      if (minigameType === MINIGAME_TYPES.AMP_CALIBRATION) {
        return <AmpCalibrationScene />
      }
      return <RoadieRunScene />
    case GAME_PHASES.GIG:
    case GAME_PHASES.PRACTICE:
      return <Gig />
    // ...
    default:
      return <MainMenu />
  }
}
```

## 5. Barrel Files (`index.ts`)

An analysis was conducted for any barrel files (`index.ts`) that re-export scenes.
- **`src/scenes/`:** No barrel files (`index.ts`) exist.
- **`src/components/`:** Only `src/components/overworld/index.ts` exists, which does not act as a barrel file for `src/scenes/`.

There are no barrel files re-exporting scenes within the scene directories.

## 6. Agents

Agents in this project refer to AI coding assistants (like Jules, Claude, or Codex) utilized for development, rather than runtime application entities. They do not interact with `SceneRouter`, `GAME_PHASES`, or the scene lifecycle at runtime.

### Definition and Capabilities
Agents are LLM-powered development tools that assist with code generation, refactoring, and debugging. They operate within the environment to read codebase files, execute bash commands (like tests and linters), and modify source code based on user prompts.

### Limitations and Failure Modes
- **Context Limits:** Agents can lose context or hallucinate if instructed without strict boundaries.
- **Architectural Misalignment:** They may suggest changes that violate project-specific architectural rules (e.g., adding `propTypes` in React 19) if not properly guided by `AGENTS.md` instructions.
- **Security/Privacy:** Agents read source code and environmental context; sensitive keys should not be exposed in prompts or unchecked code paths.

### Recommended Use-Cases (Agent vs. Manual)
<details>
<summary><strong>Agent: Refactoring Scene Exports</strong></summary>
When standardizing export styles across all 14 scene files (e.g., converting mixed exports to strict named exports), an agent can efficiently generate and apply the structural diffs across multiple files simultaneously.
</details>

<details>
<summary><strong>Manual: Complex Lifecycle Debugging</strong></summary>
If `SceneRouter` fails to unmount a PIXI stage correctly during a specific minigame transition, a developer should manually trace the `useEffect` cleanup and PIXI lifecycle, as agents may struggle to holistically evaluate asynchronous engine state without extensive prompting.
</details>

### Integration Notes relevant to Scene Lifecycle
While agents do not participate in the `SceneRouter` or `GAME_PHASES` logic, they are bound by the project's development rules when modifying these systems. For example, when using an agent to add a new scene to `GAME_PHASES`, the agent must be instructed to adhere to the rule: *"Use named exports exclusively for Scene components... When using React lazy loading, import them via the '.then(m => ({ default: m.SceneName }))' mapping pattern."*
