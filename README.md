# [NEUROTOXIC: GRIND THE VOID v3.0](https://www.instagram.com/neurotoxicband/)

This is the **designer‑driven** incarnation of the NEUROTOXIC game concept, carved out like a blastbeat across the void.

## Design Dogma: Void Worship

- **Aesthetic First**: Toxic Green on Void Black, enforced globally like a permanent blackout show, no mercy, no light mode.
- **Typography**: Metal Mania for screaming headers, Courier‑style monospaced body copy for that terminal bunker vibe.
- **Motion**: Razor‑cut transitions and glitch bursts to sell the unstable, collapsing void reality.
- **Interaction**: Buttons are huge, loud, and hyper‑reactive, built to feel like stomping a distortion pedal on stage.

## Tech Stack: Gear List of Doom

- **React 19.2.4**: Core necromancer animating the UI shell.
- **Pixi.js 8.17.0**: High‑performance 2D renderer driving the rhythm hellride at 60fps.
- **Tone.js 15.5.6**: WebAudio rig for procedural metal patterns and gig playback.
- **Framer Motion 12.36.0**: Glitch injector and transition shredder for UI states.
- **Tailwind CSS v4.2.1**: Utility riff machine for brutalist layout control.
- **Vite 7.3.1**: Ultrafast dev and build pipeline for zero‑patience iteration.

## Core Systems: Architectures of Suffering

- **Rhythm Engine**: Custom Pixi.js timing grid managing falling notes and hit detection with high‑precision frame sync at 60fps.
- **Roguelike Map**: Non‑linear overworld, letting you route your own tour instead of marching a corridor.
- **Economy System**: Stripped‑down money loop for upgrades, tuned for MVP grind instead of spreadsheet sim.
- **Audio System**: Tone.js drives generative metal riffs, ambient MIDI, and gig playback via WebAudio buffers.

## Rituals: Run, Test, Deploy

- **Prerequisites**

- Node.js >= 22.13.0 is required. (Run `nvm use` to align with `.nvmrc`)

- **Run**
  1. `pnpm install`
  2. `pnpm run dev`

- **Testing**  
  Game logic (economy, simulation, rhythm math) is wired into an automated test gauntlet.

  ```bash
  pnpm run test
  ```

- **Production Build**

  ```bash
  pnpm run build
  ```

  Output is emitted into the `dist/` directory, ready to be served to the void.

  The audio stack depends on external audio assets and the Web Audio API, so production deployments must run over **HTTPS** to avoid mixed‑content issues and broken sound.

## Controls: Limb‑Loss Protocol

- **Intro Video**: Starts on boot and transitions into the Main Menu.
- **Overworld**: Click nodes to travel; use the Radio widget (▶/■) to toggle ambient music on and off.
- **Gig**:
  - Inputs: Left Arrow = Guitar, Down Arrow = Drums, Right Arrow = Bass.
  - Pause: Hit `Escape` to pause/resume or abandon the current gig mid‑set.

## Credits

Based on the NEUROTOXIC band universe.
Built by Jules (Designer-Turned-Developer).

_Documentation sync: dependency/tooling baseline reviewed on 2026-03-14._

## Localization & Review Update

- Treat all user-facing strings as localized content; use namespaced keys (`ui:*`, `events:*`, etc.) instead of hardcoded text.
- When introducing new i18n keys, update both `public/locales/en/*.json` and `public/locales/de/*.json` in the same change.
- Keep interpolation placeholders consistent across languages (e.g., `{{cost}}`, `{{location}}`).
- For non-visual error/toast paths, prefer resilient fallbacks (`defaultValue`) so missing keys do not surface raw key names to players.
- In React callbacks/hooks, keep translation usage consistent with hook dependency expectations (`t` included in callback deps when used in callback scope).
- Before merging localization work, run the project test commands (`pnpm run test` and `pnpm run test:ui`) and include results in the PR summary.
