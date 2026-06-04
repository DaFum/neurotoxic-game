/**
 * Raw MIDI tempo-map entry.
 */
export interface TempoMapEntry {
  tick: number
  usPerBeat: number
}

/**
 * Tempo-map entry annotated with accumulated timing offsets.
 */
export interface ProcessedTempoMapEntry extends TempoMapEntry {
  _startTick: number
  _accumulatedMicros: number
}
