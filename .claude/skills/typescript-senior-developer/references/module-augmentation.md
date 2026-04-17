# Module Augmentation & Declaration Merging

## Module Augmentation

Extend an existing module's types without editing its source:

```ts
// src/types/i18n.d.ts
import 'react-i18next'

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'ui'
    resources: {
      ui: typeof import('../public/locales/en/ui.json')
      chatter: typeof import('../public/locales/en/chatter.json')
    }
  }
}
// Now t('ui:button.save') is fully typed — wrong keys are compile errors
```

## Interface Declaration Merging

Interfaces with the same name in the same scope merge automatically:

```ts
// base definition
interface GameConfig {
  debug: boolean
}

// augmented elsewhere
interface GameConfig {
  volume: number
}

// merged result: { debug: boolean; volume: number }
```

Useful for extending third-party types or building plugin architectures.

## Global Augmentation

Add to the global scope from inside a module:

```ts
// src/types/globals.d.ts
export {}  // makes this a module

declare global {
  interface Window {
    __NEUROTOXIC_DEBUG__: boolean
  }
}
```

## Ambient Declarations (`.d.ts` files)

For files without TypeScript source (e.g., assets, non-typed packages):

```ts
// src/types/assets.d.ts
declare module '*.svg' {
  const content: string
  export default content
}

declare module '*.ogg' {
  const src: string
  export default src
}
```

## When to Use Each

| Technique | Use case |
|---|---|
| Module augmentation | Extend third-party library types (react-i18next, window) |
| Declaration merging | Plugin/extension patterns, gradual type additions |
| Ambient declarations | Non-TS file types (SVG, OGG, WASM) |
| Global augmentation | Browser globals, test utilities on `globalThis` |
