import * as Tone from 'tone'

let guitar, bass, drumKit, loop, part
let isSetup = false

// Initialisierung der Synths und Effekte
/**
 * Initializes the audio subsystem, including synths, effects, and master compressor.
 * @returns {Promise<void>}
 */
export async function setupAudio() {
  if (isSetup) return
  await Tone.start()

  // Master Chain
  const masterComp = new Tone.Compressor(-30, 3).toDestination()

  // --- Gitarre ---
  guitar = new Tone.PolySynth(Tone.MonoSynth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.05, release: 0.1 },
    filterEnvelope: {
      attack: 0.001,
      decay: 0.1,
      sustain: 0,
      baseFrequency: 150,
      octaves: 4
    }
  })

  const distortion = new Tone.Distortion(0.8)
  const widener = new Tone.StereoWidener(0.7)
  const eq = new Tone.EQ3(-2, -5, 2) // Mid Scoop

  guitar.chain(distortion, eq, widener, masterComp)

  // --- Bass ---
  bass = new Tone.PolySynth(Tone.MonoSynth, {
    oscillator: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.2 },
    filterEnvelope: {
      attack: 0.001,
      decay: 0.2,
      sustain: 0.1,
      baseFrequency: 80,
      octaves: 2
    }
  })

  const bassEq = new Tone.EQ3(2, 0, -2)
  const bassComp = new Tone.Compressor(-20, 4)
  bass.chain(bassComp, bassEq, masterComp)


  // --- Drums ---
  drumKit = {
    kick: new Tone.MembraneSynth().connect(masterComp),
    snare: new Tone.NoiseSynth({
      envelope: { attack: 0.001, decay: 0.2, sustain: 0 },
      noise: { type: 'pink' }
    }).connect(masterComp),
    hihat: new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).connect(masterComp),
    crash: new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 1.0, release: 0.01 },
        harmonicity: 3.1,
        modulationIndex: 16,
        resonance: 2000,
        octaves: 2.5
    }).connect(masterComp)
  }

  // Level Mixing
  drumKit.kick.volume.value = 0
  drumKit.snare.volume.value = -5
  drumKit.hihat.volume.value = -15
  drumKit.crash.volume.value = -10

  isSetup = true
}

// Helper to resume context from UI
/**
 * Ensures the AudioContext is running and initialized.
 * @returns {Promise<void>}
 */
export async function ensureAudioContext() {
  if (!isSetup) await setupAudio()
  if (Tone.context.state !== 'running') {
    await Tone.context.resume()
  }
}

/**
 * Plays a song using predefined note data.
 * @param {object} song - The song object containing `notes` and `bpm`.
 * @param {number} [delay=0] - Delay in seconds before starting.
 */
export async function playSongFromData(song, delay = 0) {
    await ensureAudioContext()
    stopAudio()
    Tone.Transport.cancel()
    Tone.Transport.position = 0

    const bpm = song.bpm || 120
    Tone.Transport.bpm.value = bpm

    // Convert tpb ticks to seconds for exact scheduling, assuming constant BPM for now.
    // Tone.Transport allows scheduling by time.
    // time = (tick / tpb) * (60 / bpm)

    // We can use a Part to schedule events.
    // Events need { time: ..., note: ..., duration: ..., lane: ... }

    const events = song.notes.map(n => {
        // Calculate precise time in seconds
        // const seconds = (n.t / song.tpb) * (60 / bpm);
        // Actually, let's use Tone's tick system if possible, but ticks depend on PPQ.
        // Tone.Transport.PPQ defaults to 192. song.tpb is 480.
        // Easiest is to convert to seconds.
        const beatDuration = 60 / bpm;
        const time = (n.t / (song.tpb || 480)) * beatDuration;

        return {
            time: time + delay, // Schedule with delay relative to Transport start
            note: n.p,
            velocity: n.v / 127,
            lane: n.lane
        }
    })

    part = new Tone.Part((time, value) => {
        if (!guitar || !bass || !drumKit) return

        const noteName = Tone.Frequency(value.note, "midi").toNote()

        if (value.lane === 'guitar') {
            guitar.triggerAttackRelease(noteName, "16n", time, value.velocity)
        } else if (value.lane === 'bass') {
            bass.triggerAttackRelease(noteName, "8n", time, value.velocity)
        } else if (value.lane === 'drums') {
            playDrumNote(value.note, time, value.velocity)
        }
    }, events).start(0)

    Tone.Transport.start()
}

function playDrumNote(midiPitch, time, velocity) {
    // Basic GM Mapping
    // 35, 36: Bass Drum
    // 38, 40: Snare
    // 42, 44, 46: HiHat (Closed, Pedal, Open)
    // 49, 57: Crash
    // 51, 59: Ride

    // Fallback/mappings
    if (midiPitch === 35 || midiPitch === 36) {
        drumKit.kick.triggerAttackRelease("C1", "16n", time, velocity)
    } else if (midiPitch === 38 || midiPitch === 40) {
        drumKit.snare.triggerAttackRelease("16n", time, velocity)
    } else if (midiPitch === 42 || midiPitch === 44 || midiPitch === 46) {
        // Open/Closed nuance can be decay time, simpler here
        drumKit.hihat.triggerAttackRelease("8000", "32n", time, velocity * 0.8)
    } else if (midiPitch === 49 || midiPitch === 57) {
        drumKit.crash.triggerAttackRelease("C2", "8n", time, velocity)
    } else {
         // Default to HiHat for unknown percussion elements to keep rhythm
         drumKit.hihat.triggerAttackRelease("8000", "32n", time, velocity * 0.5)
    }
}

// Die eigentliche Generierungs-Logik (Legacy / Fallback)
/**
 * Starts the procedural metal music generator for a specific song configuration.
 * @param {object} song - The song object containing metadata like BPM and difficulty.
 * @param {number} [delay=0] - Delay in seconds before the audio starts.
 * @returns {Promise<void>}
 */
export async function startMetalGenerator(song, delay = 0) {
  await ensureAudioContext()

  // Reset & Cleanup before starting
  stopAudio()
  Tone.Transport.cancel() // Clear previous schedules
  Tone.Transport.position = 0 // Reset transport time

  // 1. BPM Setzen (Diff Logik)
  const bpm = song.bpm || 80 + song.difficulty * 30
  Tone.Transport.bpm.value = bpm

  // 2. Riff Pattern Generieren
  const pattern = generateRiffPattern(song.difficulty || 2)

  // 3. Sequencer Loop
  loop = new Tone.Sequence(
    (time, note) => {
      if (!guitar || !drumKit) return // Safety check

      // Guitar
      if (note) guitar.triggerAttackRelease(note, '16n', time)

      // Drum Logic
      playDrumsLegacy(time, song.difficulty || 2, note)
    },
    pattern,
    '16n'
  )

  loop.start(0)
  Tone.Transport.start(Tone.now() + Math.max(0, delay))
}

/**
 * Stops the audio transport and disposes of the current loop.
 */
export function stopAudio() {
  Tone.Transport.stop()
  if (loop) {
    loop.dispose()
    loop = null
  }
  if (part) {
    part.dispose()
    part = null
  }
}

/**
 * Pauses the audio transport.
 */
export function pauseAudio() {
  if (Tone.Transport.state === 'started') {
    Tone.Transport.pause()
  }
}

/**
 * Resumes the audio transport.
 */
export function resumeAudio() {
  if (Tone.Transport.state === 'paused') {
    Tone.Transport.start()
  }
}

// Hilfsfunktion: Riff Pattern
function generateRiffPattern(diff) {
  const steps = 16
  const pattern = []
  const density = 0.3 + diff * 0.1

  for (let i = 0; i < steps; i++) {
    if (Math.random() < density) {
      if (diff <= 2) pattern.push(Math.random() > 0.8 ? 'E3' : 'E2')
      else if (diff <= 4)
        pattern.push(
          Math.random() > 0.7 ? (Math.random() > 0.5 ? 'F2' : 'G2') : 'E2'
        )
      else {
        const notes = ['E2', 'A#2', 'F2', 'C3', 'D#3']
        pattern.push(notes[Math.floor(Math.random() * notes.length)])
      }
    } else {
      pattern.push(null)
    }
  }
  return pattern
}

// Hilfsfunktion: Drums (Legacy)
function playDrumsLegacy(time, diff, note) {
  if (diff === 5) {
    // Blast Beat
    drumKit.kick.triggerAttackRelease('C1', '16n', time)
    if (Math.random() > 0.5) drumKit.snare.triggerAttackRelease('16n', time)
    // Corrected: Pass note (frequency/pitch) first
    drumKit.hihat.triggerAttackRelease('8000', '32n', time, 0.5)
  } else {
    // Standard Groove
    if (note === 'E2' || Math.random() < diff * 0.1) {
      drumKit.kick.triggerAttackRelease('C1', '8n', time)
    }
    if (Math.random() > 0.9) {
      drumKit.snare.triggerAttackRelease('16n', time)
    }
    // HiHat Pulse
    if (time % 0.25 < 0.1)
      drumKit.hihat.triggerAttackRelease('8000', '32n', time)
  }
}
