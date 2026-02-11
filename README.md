# [NEUROTOXIC: GRIND THE VOID v3.0](https://www.instagram.com/neurotoxicband/)

This is the **designer‑driven** incarnation of the NEUROTOXIC game concept, carved out like a blastbeat across the void.

## Design Dogma: Void Worship

- **Aesthetic First**: Toxic Green on Void Black, enforced globally like a permanent blackout show, no mercy, no light mode.
- **Typography**: Metal Mania for screaming headers, Courier‑style monospaced body copy for that terminal bunker vibe.
- **Motion**: Razor‑cut transitions and glitch bursts to sell the unstable, collapsing void reality.
- **Interaction**: Buttons are huge, loud, and hyper‑reactive, built to feel like stomping a distortion pedal on stage.

## Tech Stack: Gear List of Doom

- **React 18**: Core necromancer animating the UI shell.
- **Pixi.js**: High‑performance 2D renderer driving the rhythm hellride at 60fps.
- **Tone.js**: WebAudio rig for procedural metal patterns and gig playback.
- **Framer Motion**: Glitch injector and transition shredder for UI states.
- **Tailwind CSS v4**: Utility riff machine for brutalist layout control.
- **Vite**: Ultrafast dev and build pipeline for zero‑patience iteration.

## Core Systems: Architectures of Suffering

- **Rhythm Engine**: Custom Pixi.js timing grid managing falling notes and hit detection with high‑precision frame sync at 60fps.
- **Roguelike Map**: Non‑linear overworld, letting you route your own tour instead of marching a corridor.
- **Economy System**: Stripped‑down money loop for upgrades, tuned for MVP grind instead of spreadsheet sim.
- **Audio System**: Tone.js drives generative metal riffs, ambient MIDI, and gig playback via WebAudio buffers.

## Rituals: Run, Test, Deploy

- **Prerequisites**

- Node.js >= 22.3.0 is required. (Run `nvm use` to align with `.nvmrc`)

- **Run**

  1. `npm install`
  2. `npm run dev`

- **Testing**  
  Game logic (economy, simulation, rhythm math) is wired into an automated test gauntlet.

  ```bash
  npm test
  ```

- **Production Build**

  ```bash
  npm run build
  ```

  Output is emitted into the `dist/` directory, ready to be served to the void.

  The audio stack depends on external audio assets and the Web Audio API, so production deployments must run over **HTTPS** to avoid mixed‑content issues and broken sound.

## Controls: Limb‑Loss Protocol

- **Overworld**: Click nodes to travel; use the Radio widget (▶/■) to toggle ambient music on and off.
- **Gig**:
  - Inputs: Left Arrow = Guitar, Down Arrow = Drums, Right Arrow = Bass.
  - Pause: Hit `Escape` to pause/resume or abandon the current gig mid‑set.

## Credits

Based on the NEUROTOXIC band universe.
Built by Jules (Designer-Turned-Developer).
