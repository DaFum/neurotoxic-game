# NEUROTOXIC: GRIND THE VOID v3.0

This is a Designer-Led implementation of the "NEUROTOXIC" game concept. 

## Design Philosophy (Designer-Turned-Developer)

- **Aesthetic First**: The "Toxic Green" on "Void Black" palette is enforced globally.
- **Typography**: Uses 'Metal Mania' for headers to capture the Death Metal vibe, and 'Courier New' for that raw, industrial terminal feel.
- **Motion**: Transitions are sharp. Glitch effects are used to convey the unstable nature of the void.
- **Interaction**: Buttons are big, loud, and responsive.

## Tech Stack

- **React 18**: Core UI framework.
- **Pixi.js**: High-performance 2D rendering for the Rhythm Game component.
- **Tone.js & Howler**: Advanced audio synthesis and streaming.
- **Framer Motion**: For UI animations and transitions.
- **Tailwind CSS**: Utility-first styling (v4).
- **Vite**: Build tool.

## Key Components

- **Rhythm Engine**: A custom implementation using Pixi.js to handle falling notes and hit detection with high precision (60fps).
- **Roguelike Map**: An overworld system that allows non-linear progression.
- **Economy System**: Manage money for upgrades (simplified for MVP).
- **Audio System**: Hybrid system using Tone.js for procedural generative metal tracks and Howler.js for ambient streaming.

## How to Run

1. `npm install`
2. `npm run dev`

## Testing

The project includes a comprehensive test suite for game logic (economy, simulation, rhythm calculations).

```bash
npm test
```

## Building for Production

To create a production-ready build:

```bash
npm run build
```

The output will be in the `dist/` directory.

**Note**: The audio system relies on external streams and Web Audio API. Ensure the application is served over **HTTPS** in production to prevent mixed content errors and ensure full audio functionality.

## Controls

- **Overworld**: Click nodes to travel. Use the Radio widget (▶/■) to toggle ambient music.
- **Gig**:
  - **Inputs**: Left Arrow (Guitar), Down Arrow (Drums), Right Arrow (Bass).
  - **Pause**: Press `Escape` to pause/resume the game or quit the current gig.

## Credits

Based on the NEUROTOXIC band universe.
Built by Jules (Designer-Turned-Developer).
