// Migration stubs for third-party modules without bundled TypeScript declarations.
// framer-motion, lucide-react, pixi.js, tone, and @tonejs/midi ship their own types —
// no stubs needed for those packages.



declare module '*.svg' {
  const src: string
  export default src
}
