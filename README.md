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
- **Framer Motion**: For UI animations and transitions.
- **Tailwind CSS (conceptually)**: Used standard CSS/Classes but mimicking utility patterns for speed.
- **Vite**: Build tool.

## Key Components

- **Rhythm Engine**: A custom implementation using Pixi.js to handle falling notes and hit detection with high precision (60fps).
- **Roguelike Map**: An overworld system that allows non-linear progression.
- **Economy System**: Manage money for upgrades (simplified for MVP).

## How to Run

1. `npm install`
2. `npm run dev`

## Credits

Based on the NEUROTOXIC band universe.
Built by Jules (Designer-Turned-Developer).
