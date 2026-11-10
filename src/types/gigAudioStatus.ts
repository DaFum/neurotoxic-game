export type GigAudioStatus =
  'idle' | 'initializing' | 'ready' | 'blocked' | 'failed'

/** What a 'failed' gig initialization failed on: audio setup or the stage. */
export type GigFailureKind = 'audio' | 'stage'

/** Discriminated union tracking the initialization and readiness of a gig. */
export type GigInitStatus =
  | { status: 'idle' }
  | { status: 'initializing' }
  | { status: 'ready' }
  | { status: 'blocked' }
  | { status: 'failed'; failureKind: GigFailureKind }
