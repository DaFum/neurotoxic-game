/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_LEADERBOARD_SYNC?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
  // Vite injects `import.meta.glob` at build time. Provide a minimal typing
  // so TypeScript is happy when code references it directly in source.
  glob?: (pattern: string, opts?: unknown) => Record<string, unknown>
}
