export interface TempoMapEntry {
  tick: number
  usPerBeat: number
}

export interface ProcessedTempoMapEntry extends TempoMapEntry {
  _startTick: number
  _accumulatedMicros: number
}
