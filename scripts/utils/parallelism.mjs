import { availableParallelism } from 'node:os'

// node:test isolates files in processes, so concurrency also overlaps startup
// and TSX import latency. The cap bounds peak memory on larger machines.
export const computeProcessWorkerCount = availableWorkers =>
  Math.min(16, Math.max(1, availableWorkers * 4))

export const computeWorkerCount = (
  envVarName,
  fallbackCount = Math.max(1, availableParallelism())
) => {
  const rawEnv = process.env[envVarName] ?? `${fallbackCount}`

  // Validate that the string matches a whole number pattern before parsing
  if (!/^\d+$/.test(rawEnv)) {
    return Math.max(1, fallbackCount)
  }

  const configuredCount = Number.parseInt(rawEnv, 10)

  return Number.isFinite(configuredCount)
    ? Math.max(1, configuredCount)
    : Math.max(1, fallbackCount)
}
