# [NEUROTOXIC: GRIND THE VOID v3.0](https://www.instagram.com/neurotoxicband/)

A rhythm-based roguelike metal band management game where you survive the void and carve out a blastbeat legacy.

This is the designer-driven incarnation of the NEUROTOXIC game concept. We built this project to provide an intense, audio-driven metal experience combining brutal aesthetics, custom rhythm engines, and ruthless resource management.

## Table of Contents
- [Design Dogma](#design-dogma)
- [Tech Stack](#tech-stack-gear-list-of-doom)
- [Core Systems](#core-systems-architectures-of-suffering)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Controls](#controls)
- [Localization & Review Update](#localization--review-update)
- [Links](#links)
- [Credits](#credits)

## Design Dogma

- **Aesthetic First**: Toxic Green on Void Black, enforced globally like a permanent blackout show, no mercy, no light mode.
- **Typography**: Metal Mania for screaming headers, Courier‑style monospaced body copy for that terminal bunker vibe.
- **Motion**: Razor‑cut transitions and glitch bursts to sell the unstable, collapsing void reality.
- **Interaction**: Buttons are huge, loud, and hyper‑reactive, built to feel like stomping a distortion pedal on stage.

## Tech Stack: Gear List of Doom

- **React 19.2.5**: Core necromancer animating the UI shell.
- **Pixi.js 8.18.1**: High‑performance 2D renderer driving the rhythm hellride at 60fps.
- **Tone.js 15.5.6**: WebAudio rig for procedural metal patterns and gig playback.
- **Framer Motion 12.38.0**: Glitch injector and transition shredder for UI states.
- **Tailwind CSS v4.2.3**: Utility riff machine for brutalist layout control.
- **Vite 8.0.9**: Ultrafast dev and build pipeline for zero‑patience iteration.

## Core Systems: Architectures of Suffering

- **Rhythm Engine**: Custom Pixi.js timing grid managing falling notes and hit detection with high‑precision frame sync at 60fps.
- **Roguelike Map**: Non‑linear overworld, letting you route your own tour instead of marching a corridor.
- **Economy System**: Stripped‑down money loop for upgrades, tuned for MVP grind instead of spreadsheet sim.
- **Audio System**: Tone.js drives generative metal riffs, ambient MIDI, and gig playback via WebAudio buffers.

## Installation

```bash
# Clone the repository
git clone https://github.com/DaFum/neurotoxic-game.git
cd neurotoxic-game

# Node.js >= 22.13.0 is required
nvm use

# Install dependencies using pnpm
pnpm install
```

## Quick Start

Run the game locally in development mode:

```bash
pnpm run dev
```
> **Expected Output:** The Vite development server will start on `http://localhost:5173`. Open this URL in your browser to play the game.

### Testing

Game logic (economy, simulation, rhythm math) is wired into an automated test gauntlet.

```bash
pnpm run test
```

### Production Build

```bash
pnpm run build
```

Output is emitted into the `dist/` directory, ready to be served to the void.
The audio stack depends on external audio assets and the Web Audio API, so production deployments must run over **HTTPS** to avoid mixed-content issues and broken sound.

## Controls

- **Intro Video**: Starts on boot and transitions into the Main Menu.
- **Overworld**: Click nodes to travel; use the Radio widget (▶/■) to toggle ambient music on and off.
- **Gig**:
  - Inputs: Left Arrow = Guitar, Down Arrow = Drums, Right Arrow = Bass.
  - Pause: Hit `Escape` to pause/resume or abandon the current gig mid‑set.


## Links
- [License](LICENSE)
- [Contributing](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Changelog](CHANGELOG.md)

## Credits

Based on the NEUROTOXIC band universe.
Built by Jules (Designer-Turned-Developer).

_Documentation sync: dependency/tooling baseline reviewed on 2026-04-16._

## Localization & Review Update

- Treat all user-facing strings as localized content; use namespaced keys (`ui:*`, `events:*`, etc.) instead of hardcoded text.
- When introducing new i18n keys, update both `public/locales/en/*.json` and `public/locales/de/*.json` in the same change.
- Keep interpolation placeholders consistent across languages (e.g., `{{cost}}`, `{{location}}`).
- For non-visual error/toast paths, prefer resilient fallbacks (`defaultValue`) so missing keys do not surface raw key names to players.
- In React callbacks/hooks, keep translation usage consistent with hook dependency expectations (`t` included in callback deps when used in callback scope).
- Before merging localization work, run the project test commands (`pnpm run test` and `pnpm run test:ui`) and include results in the PR summary.
