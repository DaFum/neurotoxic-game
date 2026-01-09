import { Howl, Howler } from 'howler'
import * as Tone from 'tone'
import { SoundSynthesizer } from './SoundSynthesizer.js'

class AudioSystem {
  constructor () {
    this.music = null
    this.synth = new SoundSynthesizer()
    this.musicVolume = 0.5
    this.sfxVolume = 0.5
    this.muted = false
    this.initialized = false
  }

  async init () {
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

      this.musicVolume = savedMusicVol != null ? clamp01(savedMusicVol, 0.5) : 0.5
      this.sfxVolume = savedSfxVol != null ? clamp01(savedSfxVol, 0.5) : 0.5
      this.muted = savedMuted === 'true'

      // Apply global mute
      Howler.mute(this.muted)

      // Initialize Synth
      this.synth.init()
      this.synth.setVolume(this.sfxVolume)

      this.initialized = true
    } catch (error) {
      console.error('[AudioSystem] Initialization failed:', error)
      // Graceful fallback: audio might just not play, but app shouldn't crash.
    }
  }

  playMusic (songId) {
    if (!this.initialized) return

    // Clean up previous instance explicitly
    if (this.music) {
      this.music.stop()
      this.music.unload() // Free resources/pool slot
      this.music = null
    }

    const src = this.getAudioSrc(songId)

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
      }
    })

    this.music.play()
    return this.music
  }

  startAmbient () {
    if (!this.initialized) return
    // Prevent restarting if already playing ambient
    // Check if current music is the ambient track to avoid reloading stream
    // Note: checking loop() is weak if we change logic, better check source or id.
    // Assuming single music track architecture for now.
    const ambientSrc = this.getAudioSrc('ambient')
    if (this.music && this.music.playing() && this.music._src && this.music._src.includes(ambientSrc)) {
      return
    }

    const music = this.playMusic('ambient')
    if (music) {
      music.volume(this.musicVolume * 0.3) // Lower volume for background stream
    }
  }

  stopMusic () {
    if (this.music) this.music.stop()
  }

  pauseMusic () {
    if (this.music) this.music.pause()
  }

  resumeMusic () {
    if (this.music && !this.music.playing()) {
      if (this.music.state() === 'loaded') {
        this.music.play()
      }
    } else if (!this.music) {
      this.startAmbient()
    }
  }

  playSFX (key) {
    if (!this.initialized) return
    this.synth.play(key)
  }

  setMusicVolume (vol) {
    this.musicVolume = vol
    localStorage.setItem('neurotoxic_vol_music', vol)
    if (this.music) {
      this.music.volume(vol)
    }
  }

  setSFXVolume (vol) {
    this.sfxVolume = vol
    localStorage.setItem('neurotoxic_vol_sfx', vol)
    this.synth.setVolume(vol)
  }

  toggleMute () {
    this.muted = !this.muted
    Howler.mute(this.muted)

    try {
      Tone.Destination.mute = this.muted
    } catch (e) {
      console.warn('[AudioSystem] Tone.js mute failed:', e)
    }

    localStorage.setItem('neurotoxic_muted', this.muted)
    return this.muted
  }

  getAudioSrc (songId) {
    if (songId === 'ambient') return 'https://moshhead-blackmetal.stream.laut.fm/moshhead-blackmetal'
    return 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  }

  dispose () {
    this.stopMusic()
    Howler.unload()
    this.synth.dispose()
    this.initialized = false
  }
}

export const audioManager = new AudioSystem()
// Auto-init for now, or let MainMenu call it?
// Ideally MainMenu or App calls init.
// For backward compatibility with existing usage, we can lazy init or call it here.
// But mostly synchronous calls expect it ready.
// We will trigger init but not await it here, allowing it to load in background.
audioManager.init()
