/**
 * A lightweight Web Audio API synthesizer for sound effects (hits, misses, UI).
 */
export class SoundSynthesizer {
  constructor() {
    this.ctx = null
    this.masterGain = null
    this.volume = 0.5
    this.muted = false
  }

  /**
   * Initializes the AudioContext and master gain node.
   */
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (AudioContext) {
        this.ctx = new AudioContext()
        this.masterGain = this.ctx.createGain()
        this.masterGain.gain.value = this.volume
        this.masterGain.connect(this.ctx.destination)
      }
    }
  }

  /**
   * Sets the master volume.
   * @param {number} vol - Volume between 0 and 1.
   */
  setVolume(vol) {
    this.volume = vol
    if (this.masterGain && !this.muted) {
      this.masterGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.01)
    }
  }

  /**
   * Mutes or unmutes the synthesizer.
   * @param {boolean} muted - Mute state.
   */
  setMute(muted) {
    this.muted = muted
    if (this.masterGain) {
      const targetVol = muted ? 0 : this.volume
      this.masterGain.gain.setTargetAtTime(
        targetVol,
        this.ctx.currentTime,
        0.01
      )
    }
  }

  /**
   * Plays a success "Hit" sound.
   */
  playHit() {
    if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(880, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.1)

    gain.gain.setValueAtTime(0.5, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.1)
  }

  /**
   * Plays a failure "Miss" sound.
   */
  playMiss() {
    if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(150, this.ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.3)

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.3)
  }

  /**
   * Plays a generic UI menu click sound.
   */
  playMenu() {
    if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, this.ctx.currentTime)

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start()
    osc.stop(this.ctx.currentTime + 0.05)
  }

  /**
   * Plays a travel/engine rumble sound.
   */
  playTravel() {
    if (!this.ctx) return
    // Simple low rumble
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'square'
    osc.frequency.setValueAtTime(80, this.ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 1.0)

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.0)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start()
    osc.stop(this.ctx.currentTime + 1.0)
  }

  /**
   * Triggers a sound effect by key.
   * @param {string} key - The key of the sound to play.
   */
  play(key) {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }

    switch (key) {
      case 'hit':
        this.playHit()
        break
      case 'miss':
        this.playMiss()
        break
      case 'menu':
        this.playMenu()
        break
      case 'travel':
        this.playTravel()
        break
      default:
        break
    }
  }

  /**
   * Closes the AudioContext.
   */
  dispose() {
    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
    }
  }
}
