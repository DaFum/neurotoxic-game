/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_LEADERBOARD_SYNC?: string
  readonly VITE_ENABLE_VERCEL_TELEMETRY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
