/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV?: boolean
  readonly PROD?: boolean
  readonly VITE_ENABLE_LEADERBOARD_SYNC?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
