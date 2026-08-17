import crypto from 'node:crypto'

const round = value => value == null ? null : Number(value.toFixed(2))
const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
const median = values => {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}
const quantile = (values, probability) => {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const position = (sorted.length - 1) * probability
  const lower = Math.floor(position)
  const fraction = position - lower
  return sorted[lower + 1] === undefined
    ? sorted[lower]
    : sorted[lower] + fraction * (sorted[lower + 1] - sorted[lower])
}
const stdDev = values => {
  if (values.length <= 1) return 0
  const average = mean(values)
  return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1))
}
const describe = values => ({
  mean: round(mean(values)), median: round(median(values)), stdDev: round(stdDev(values)),
  p10: round(quantile(values, 0.1)), p25: round(quantile(values, 0.25)),
  p75: round(quantile(values, 0.75)), p90: round(quantile(values, 0.9)),
  min: values.length ? round(Math.min(...values)) : null,
  max: values.length ? round(Math.max(...values)) : null
})

const seededRandom = seed => {
  let state = crypto.createHash('sha256').update(seed).digest().readUInt32LE(0)
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export const deterministicBootstrapConfidence = (values, seed, resamples = 2000) => {
  if (!values.length) return { mean: { lower: null, upper: null, method: 'paired-bootstrap', resamples }, median: { lower: null, upper: null, method: 'paired-bootstrap', resamples } }
  const random = seededRandom(seed)
  const means = []
  const medians = []
  for (let sampleIndex = 0; sampleIndex < resamples; sampleIndex++) {
    const sample = Array.from({ length: values.length }, () => values[Math.floor(random() * values.length)])
    means.push(mean(sample))
    medians.push(median(sample))
  }
  const interval = samples => ({
    lower: round(quantile(samples, 0.025)), upper: round(quantile(samples, 0.975)),
    method: 'paired-bootstrap', resamples
  })
  return { mean: interval(means), median: interval(medians) }
}

export const pairedMetricStatistics = (control, candidate, { bootstrapSeed, resamples = 2000 }) => {
  if (control.length !== candidate.length) throw new RangeError('Paired populations must have equal length')
  const deltas = control.map((value, index) => candidate[index] - value)
  const positiveCount = deltas.filter(value => value > 0).length
  const negativeCount = deltas.filter(value => value < 0).length
  return {
    control: describe(control), candidate: describe(candidate),
    pairedDelta: {
      ...describe(deltas), count: deltas.length, positiveCount, negativeCount,
      unchangedCount: deltas.length - positiveCount - negativeCount,
      candidateWinRatePct: round(deltas.length ? positiveCount / deltas.length * 100 : 0),
      confidence95: deterministicBootstrapConfidence(deltas, bootstrapSeed, resamples)
    }
  }
}

export const bankruptcyTransitions = (control, candidate) => {
  if (control.length !== candidate.length) throw new RangeError('Paired populations must have equal length')
  const matrix = { bothSolvent: 0, controlOnlyBankrupt: 0, candidateOnlyBankrupt: 0, bothBankrupt: 0 }
  control.forEach((bankrupt, index) => {
    const candidateBankrupt = candidate[index]
    if (bankrupt && candidateBankrupt) matrix.bothBankrupt++
    else if (bankrupt) matrix.controlOnlyBankrupt++
    else if (candidateBankrupt) matrix.candidateOnlyBankrupt++
    else matrix.bothSolvent++
  })
  const controlCount = control.filter(Boolean).length
  const candidateCount = candidate.filter(Boolean).length
  return {
    bankruptcyTransitions: matrix,
    controlRatePct: round(control.length ? controlCount / control.length * 100 : 0),
    candidateRatePct: round(candidate.length ? candidateCount / candidate.length * 100 : 0),
    deltaRatePct: round(control.length ? (candidateCount - controlCount) / control.length * 100 : 0),
    netRecoveredRuns: matrix.controlOnlyBankrupt,
    netHarmedRuns: matrix.candidateOnlyBankrupt
  }
}
