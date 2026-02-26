import { logger } from '../logger.js'
import { audioState } from './state.js'
import { stopAudio } from './playback.js'
import { midiUrlMap, oggCandidates, loadAudioBuffer } from './assets.js'
import { createAndConnectBufferSource } from './sharedBufferUtils.js'
import { selectRandomItem } from './selectionUtils.js'
import { ensureAudioContext } from './setup.js'
import { playMidiFileInternal } from './midiPlayback.js'
import { SONGS_DB } from '../../data/songs.js'

/**
 * Plays a random MIDI file from the available set for ambient music.
 * @param {Array} [songs] - Song metadata array for excerpt offset lookup.
 * @param {Function} [rng] - Random number generator function.
 * @returns {Promise<boolean>} Whether playback started successfully.
 */
export async function playRandomAmbientMidi(
  songs = SONGS_DB,
  rng = Math.random
) {
  logger.debug('AudioEngine', 'playRandomAmbientMidi called')
  // Requirement: Stop transport before starting ambient
  stopAudio()
  const reqId = audioState.playRequestId

  const midiFiles = Object.keys(midiUrlMap)
  if (midiFiles.length === 0) {
    logger.warn('AudioEngine', 'No MIDI files found in midiUrlMap')
    return false
  }

  // Requirement: pick a random MIDI from the assets folder
  const filename = selectRandomItem(midiFiles, rng)
  if (!filename) {
    logger.warn('AudioEngine', 'Random MIDI selection returned null')
    return false
  }

  // If the MIDI is known in SONGS_DB, we might use metadata, but for Ambient we always start from 0
  const meta = songs.find(s => s.sourceMid === filename)
  // Requirement: Ambient always plays from the beginning (0s)
  const offsetSeconds = 0

  logger.debug(
    'AudioEngine',
    `Playing ambient: ${meta?.name ?? filename} (offset ${offsetSeconds}s)`
  )
  return playMidiFileInternal(
    filename,
    offsetSeconds,
    false,
    0,
    {
      useCleanPlayback: true,
      onEnded: () => {
        if (reqId !== audioState.playRequestId) {
          logger.debug(
            'AudioEngine',
            `Ambient MIDI chain cancelled (reqId ${reqId} vs current ${audioState.playRequestId}).`
          )
          return
        }
        logger.debug(
          'AudioEngine',
          'Ambient MIDI track ended, chaining next track.'
        )
        playRandomAmbientMidi(songs, rng).catch(error => {
          logger.error(
            'AudioEngine',
            'Failed to start next ambient MIDI track',
            error
          )
        })
      }
    },
    reqId
  )
}

/**
 * Plays a random OGG file from the bundled assets for ambient music.
 * Uses raw AudioBufferSourceNode connected to the musicGain bus for
 * lower CPU usage and better quality than MIDI synthesis.
 * @param {Function} [rng] - Random number generator function.
 * @param {object} [options] - Playback options.
 * @param {boolean} [options.skipStop=false] - Skip internal stopAudio() when caller already stopped audio.
 * @returns {Promise<boolean>} Whether playback started successfully.
 */
export async function playRandomAmbientOgg(
  rng = Math.random,
  { skipStop = false } = {}
) {
  logger.debug('AudioEngine', 'playRandomAmbientOgg called')
  // Skip stopAudio() when caller has already stopped audio to avoid double-stop
  // and unnecessary playRequestId increments (e.g., AudioManager.startAmbient calls stopMusic first)
  if (!skipStop) {
    stopAudio()
  }

  if (oggCandidates.length === 0) {
    logger.warn('AudioEngine', 'No OGG files available for ambient playback')
    return false
  }

  const filename = selectRandomItem(oggCandidates, rng)
  if (!filename) {
    logger.warn('AudioEngine', 'Random OGG selection returned null')
    return false
  }

  const reqId = ++audioState.playRequestId
  const unlocked = await ensureAudioContext()
  if (!unlocked) return false
  if (reqId !== audioState.playRequestId) return false

  const buffer = await loadAudioBuffer(filename)
  if (!buffer) return false
  if (reqId !== audioState.playRequestId) return false

  const source = createAndConnectBufferSource(buffer)
  if (!source) return false

  audioState.ambientSource = source
  const chainReqId = audioState.playRequestId

  source.onended = () => {
    if (audioState.ambientSource !== source) {
      logger.debug(
        'AudioEngine',
        'Ambient OGG onended: source mismatch, skipping chain.'
      )
      return
    }
    if (chainReqId !== audioState.playRequestId) {
      logger.debug(
        'AudioEngine',
        `Ambient OGG chain cancelled (reqId ${chainReqId} vs current ${audioState.playRequestId}).`
      )
      return
    }
    audioState.ambientSource = null
    logger.debug('AudioEngine', 'Ambient OGG track ended, chaining next track.')
    playRandomAmbientOgg(rng).catch(error => {
      logger.error(
        'AudioEngine',
        'Failed to chain next ambient OGG track',
        error
      )
    })
  }

  source.start()
  logger.debug(
    'AudioEngine',
    `Ambient OGG started: ${filename} (${buffer.duration.toFixed(1)}s)`
  )
  return true
}
