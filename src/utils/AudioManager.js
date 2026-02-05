import { Howl, Howler } from 'howler'
import * as Tone from 'tone'
import * as audioEngine from './audioEngine.js'

/**
 * Manages global audio playback including music (Howler.js) and SFX (audioEngine.js).
 */
class AudioSystem {
  constructor() {
    this.music = null
    this.currentSongId = null
    this.musicVolume = 0.5
    this.sfxVolume = 0.5
    this.muted = false
    this.initialized = false
  }

  /**
   * Initializes the audio system, loading preferences and setting up synthesizers.
   * @returns {Promise<void>}
   */
  async init() {
    if (this.initialized) return

    try {
      // Load preferences
      const savedMusicVol = localStorage.getItem('neurotoxic_vol_music')
      const savedSfxVol = localStorage.getItem('neurotoxic_vol_sfx')
      const savedMuted = localStorage.getItem('neurotoxic_muted')

      const clamp01 = (n, fallback) => {
        const v = Number.parseFloat(n)
        if (!Number.isFinite(v)) return fallback
        return Math.min(1, Math.max(0, v))
      }

      this.musicVolume =
        savedMusicVol != null ? clamp01(savedMusicVol, 0.5) : 0.5
      this.sfxVolume = savedSfxVol != null ? clamp01(savedSfxVol, 0.5) : 0.5
      this.muted = savedMuted === 'true'

      // Apply global mute
      Howler.mute(this.muted)

      // Initialize Audio Engine settings (but don't start Context yet)
      audioEngine.setSFXVolume(this.muted ? 0 : this.sfxVolume)

      // Tone mute is handled globally by Volume node in engine if implemented, or we can use Destination
      Tone.Destination.mute = this.muted
    } catch (error) {
      console.error('[AudioSystem] Initialization failed:', error)
      // Graceful fallback: audio might just not play, but app shouldn't crash.
    }
  }

  /**
   * Plays a music track by ID.
   * @param {string} songId - The ID of the song to play (or 'ambient').
   * @returns {object|null} The Howl instance or null if not initialized.
   */
  playMusic(songId) {
    if (!this.initialized) return null

    // Clean up previous instance explicitly
    if (this.music) {
      this.music.stop()
      this.music.unload() // Free resources/pool slot
      this.music = null
    }

    const src = this.getAudioSrc(songId)
    this.currentSongId = songId

    this.music = new Howl({
      src: [src],
      html5: true,
      loop: songId === 'ambient',
      volume: this.musicVolume,
      onplayerror: (id, err) => {
        console.warn('[AudioSystem] Play error, attempting unlock:', err)
        this.music.once('unlock', () => {
          this.music.play()
        })
      },
      onloaderror: (id, err) => {
        if (songId === 'ambient') {
          console.warn(
            '[AudioSystem] Ambient stream failed to load, switching to fallback.',
            err
          )
          // Fallback to static MP3 if stream fails
          if (this.music) {
            this.music.unload()
            this.music = new Howl({
              src: [
                'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
              ],
              html5: true,
              loop: true,
              volume: this.musicVolume,
              mute: this.muted
            })
            this.music.play()
          }
        }
      }
    })

    this.music.play()
    return this.music
  }

  /**
   * Starts the ambient background music stream if not already playing.
   */
  startAmbient() {
    if (!this.initialized) return
    // Prevent restarting if already playing ambient
    // Check if current music is the ambient track to avoid reloading stream
    // Note: checking loop() is weak if we change logic, better check source or id.
    // Assuming single music track architecture for now.
    if (
      this.music &&
      this.music.playing() &&
      this.currentSongId === 'ambient'
    ) {
      return
    }

    const music = this.playMusic('ambient')
    if (music) {
      music.volume(this.musicVolume * 0.3) // Lower volume for background stream
    }
  }

  /**
   * Stops the currently playing music.
   */
  stopMusic() {
    if (this.music) this.music.stop()
  }

  /**
   * Pauses the currently playing music.
   */
  pauseMusic() {
    if (this.music) this.music.pause()
  }

  /**
   * Resumes the paused music or starts ambient if none is loaded.
   */
  resumeMusic() {
    if (this.music && !this.music.playing()) {
      if (this.music.state() === 'loaded') {
        this.music.play()
      }
    } else if (!this.music) {
      this.startAmbient()
    }
  }

  /**
   * Ensures the AudioContext is running (Tone.js and Howler).
   * Should be called after a user gesture.
   */
  async ensureAudioContext() {
    try {
      if (!this.initialized) {
        await audioEngine.setupAudio()
        this.initialized = true
      }
      await audioEngine.ensureAudioContext()
      if (Howler.ctx && Howler.ctx.state !== 'running') {
        await Howler.ctx.resume()
      }
    } catch (e) {
      console.warn('[AudioSystem] Failed to resume AudioContext:', e)
    }
  }

  /**
   * Plays a sound effect by key.
   * @param {string} key - The SFX identifier (e.g., 'CLICK', 'ERROR').
   */
  playSFX(key) {
    if (!this.initialized) return
    const validTypes = ['hit', 'miss', 'menu', 'travel', 'cash']
    if (!validTypes.includes(key)) {
      console.warn(`[AudioSystem] Unknown SFX type: ${key}`)
      return
    }
    audioEngine.playSFX(key)
  }

  /**
   * Sets the music volume and persists it.
   * @param {number} vol - Volume level between 0 and 1.
   */
  setMusicVolume(vol) {
    const next = Math.min(1, Math.max(0, vol))
    this.musicVolume = next
    localStorage.setItem('neurotoxic_vol_music', next)
    if (this.music) {
      this.music.volume(next)
    }
  }

  /**
   * Sets the SFX volume and persists it.
   * @param {number} vol - Volume level between 0 and 1.
   */
  setSFXVolume(vol) {
    const next = Math.min(1, Math.max(0, vol))
    this.sfxVolume = next
    localStorage.setItem('neurotoxic_vol_sfx', next)
    audioEngine.setSFXVolume(next)
  }

  /**
   * Toggles global mute state.
   * @returns {boolean} The new mute state.
   */
  toggleMute() {
    this.muted = !this.muted
    Howler.mute(this.muted)

    try {
      Tone.Destination.mute = this.muted
      audioEngine.setSFXVolume(this.muted ? 0 : this.sfxVolume)
    } catch (e) {
      console.warn('[AudioSystem] Tone.js mute failed:', e)
    }

    localStorage.setItem('neurotoxic_muted', this.muted)
    return this.muted
  }

  /**
   * Resolves the source URL for a given song ID.
   * @param {string} songId - The song ID.
   * @returns {string} The URL string.
   */
  getAudioSrc(songId) {
    if (songId === 'ambient') {
      return 'https://moshhead-blackmetal.stream.laut.fm/moshhead-blackmetal'
    }
    return 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  }

  /**
   * Disposes of the audio system, unloading resources.
   */
  dispose() {
    this.stopMusic()
    Howler.unload()
    audioEngine.disposeAudio?.()
    this.initialized = false
  }
}

export const audioManager = new AudioSystem()
audioManager.init()
