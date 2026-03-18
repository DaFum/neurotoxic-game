import { availableParallelism } from 'node:os'

export const computeWorkerCount = (
  envVarName,
  fallbackCount = Math.max(1, availableParallelism() - 1)
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
