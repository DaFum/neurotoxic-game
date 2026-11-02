export type GigAudioStatus =
  'idle' | 'initializing' | 'ready' | 'blocked' | 'failed'

/** What a 'failed' gig initialization failed on: audio setup or the stage. */
export type GigFailureKind = 'audio' | 'stage'
