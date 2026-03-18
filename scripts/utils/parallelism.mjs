import { availableParallelism } from 'node:os'

export const computeWorkerCount = (
  envVarName,
  fallbackCount = Math.max(1, availableParallelism() - 1)
) => {
  const configuredCount = Number.parseInt(
    process.env[envVarName] ?? `${fallbackCount}`,
    10
  )

  return Number.isFinite(configuredCount)
    ? Math.max(1, configuredCount)
    : Math.max(1, fallbackCount)
}
