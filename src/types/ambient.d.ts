// Migration stubs for third-party modules without bundled TypeScript declarations.
// framer-motion, lucide-react, pixi.js, tone, and @tonejs/midi ship their own types —
// no stubs needed for those packages.

// Minimal process global for Vite/node:test dual-compatibility (AGENTS.md pattern).
declare const process: {
  env: Record<string, string | undefined>
}

declare module '*.svg' {
  const src: string
  export default src
}

declare module 'virtual:pwa-register/react' {
  export function useRegisterSW(options?: {
    onRegisterError?: (error: unknown) => void
  }): {
    offlineReady: [boolean, (value: boolean) => void]
    needRefresh: [boolean, (value: boolean) => void]
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>
  }
}
