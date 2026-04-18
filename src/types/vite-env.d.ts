/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_LEADERBOARD_SYNC?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
