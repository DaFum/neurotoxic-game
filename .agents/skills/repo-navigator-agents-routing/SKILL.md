---
name: repo-navigator-agents-routing
description: Route questions to the correct folder (context, hooks, scenes, utils, components, data, ui) and consult the relevant AGENTS.md first. Use when asked where logic lives or which files own behavior.
---

# AGENTS-Aware Repo Navigation

## Domain Routing Table

| Domain     | Directory         | AGENTS.md                  | Key Files                                                  |
| ---------- | ----------------- | -------------------------- | ---------------------------------------------------------- |
| State      | `src/context/`    | `src/context/AGENTS.md`    | gameReducer.js, actionCreators.js, initialState.js         |
| Hooks      | `src/hooks/`      | `src/hooks/AGENTS.md`      | useTravelLogic.js, usePurchaseLogic.js, useAudioControl.js |
| Scenes     | `src/scenes/`     | `src/scenes/AGENTS.md`     | Overworld.jsx, Gig.jsx, PostGig.jsx, MainMenu.jsx          |
| Utils      | `src/utils/`      | `src/utils/AGENTS.md`      | eventEngine.js, economyEngine.js, AudioManager.js          |
| Components | `src/components/` | `src/components/AGENTS.md` | PixiStage.jsx, GigHUD.jsx, TutorialManager.jsx             |
| Data       | `src/data/`       | `src/data/AGENTS.md`       | events.js, venues.js, songs.js, characters.js              |
| UI         | `src/ui/`         | `src/ui/AGENTS.md`         | HUD.jsx, EventModal.jsx, GlitchButton.jsx                  |

## Workflow

1. Identify the domain implied by the question (state, hooks, scenes, utils, components, data, ui).
2. Open the corresponding `src/<domain>/AGENTS.md` for authoritative local rules.
3. Use the routing table above to provide file pointers and explain why those locations are canonical.
4. If the question spans domains, list all relevant AGENTS.md files to consult.

## Output

- Provide a short path list, the relevant AGENTS.md, and next files to inspect.
