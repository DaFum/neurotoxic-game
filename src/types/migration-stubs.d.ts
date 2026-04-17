// Migration stubs for third-party modules used temporarily during an aggressive migration.
// Remove these stubs after adding proper `@types/*` packages or real type definitions.

declare module 'pixi.js' {
  const PIXI: any
  export = PIXI
}

declare module 'tone' {
  const Tone: any
  export default Tone
}

declare module '@tonejs/midi' {
  const Midi: any
  export default Midi
}

declare module 'lucide-react' {
  export const Icon: any
  const _default: any
  export default _default
}

declare module 'framer-motion' {
  export const motion: any
  const _default: any
  export default _default
}

declare module '*.svg' {
  const src: string
  export default src
}
