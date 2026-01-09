import * as Tone from 'tone'

let guitar, drumKit, loop
let isSetup = false

// Initialisierung der Synths und Effekte
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
    }).connect(masterComp)
  }

  // Level Mixing
  drumKit.kick.volume.value = 0
  drumKit.snare.volume.value = -5
  drumKit.hihat.volume.value = -15

  isSetup = true
}

// Helper to resume context from UI
export async function ensureAudioContext() {
  if (!isSetup) await setupAudio()
  if (Tone.context.state !== 'running') {
    await Tone.context.resume()
  }
}

// Die eigentliche Generierungs-Logik
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
      playDrums(time, song.difficulty || 2, note)
    },
    pattern,
    '16n'
  )

  loop.start(0)
  Tone.Transport.start('+' + delay)
}

export function stopAudio() {
  Tone.Transport.stop()
  if (loop) {
    loop.dispose()
    loop = null
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

// Hilfsfunktion: Drums
function playDrums(time, diff, note) {
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
