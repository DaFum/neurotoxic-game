import fs from 'node:fs/promises'
import path from 'node:path'

export const extractPlaceholders = value => {
  if (typeof value !== 'string') {
    return []
  }

  const matches = value.match(/{{\s*([\w.]+)\s*}}/g) ?? []
  return matches.map(match => match.replace(/{{\s*|\s*}}/g, ''))
}

export const flattenToEntries = (entry, parentKey = '') => {
  if (typeof entry === 'string') {
    return [{ key: parentKey, value: entry }]
  }

  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return []
  }

  return Object.entries(entry).flatMap(([childKey, childValue]) => {
    const nextKey = parentKey ? `${parentKey}.${childKey}` : childKey
    return flattenToEntries(childValue, nextKey)
  })
}

export const flattenToObject = (entry, parentKey = '', result = {}) => {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return result
  }

  for (const [childKey, childValue] of Object.entries(entry)) {
    const nextKey = parentKey ? `${parentKey}.${childKey}` : childKey

    if (
      childValue &&
      typeof childValue === 'object' &&
      !Array.isArray(childValue)
    ) {
      flattenToObject(childValue, nextKey, result)
    } else {
      result[nextKey] = childValue
    }
  }

  return result
}

const localeJsonCache = new Map()

export const resetLocaleJsonCache = () => localeJsonCache.clear()

export const readLocaleJson = async (directory, fileName) => {
  const localePath = path.join(directory, fileName)
  if (!localeJsonCache.has(localePath)) {
    const promise = fs.readFile(localePath, 'utf8').then(rawData => JSON.parse(rawData))
    localeJsonCache.set(localePath, promise)
  }
  const data = await localeJsonCache.get(localePath)
  return structuredClone(data)
}

export const toKeyMap = flattened =>
  flattened.reduce((accumulator, item) => {
    accumulator.set(item.key, item.value)
    return accumulator
  }, new Map())

const sourceFilesCache = new Map()

export const collectSourceFiles = async directory => {
  if (!sourceFilesCache.has(directory)) {
    const promise = fs.readdir(directory, { withFileTypes: true }).then(async entries => {
      const filePromises = entries.map(async entry => {
        const entryPath = path.join(directory, entry.name)

        if (entry.isDirectory()) {
          return collectSourceFiles(entryPath)
        }

        return /\.(js|jsx|ts|tsx)$/.test(entry.name) ? [entryPath] : []
      })

      const results = await Promise.all(filePromises)
      return results.flat()
    })
    sourceFilesCache.set(directory, promise)
  }

  return sourceFilesCache.get(directory)
}

export const resolveNamespaceKey = rawKey => {
  if (!rawKey || rawKey.endsWith(':') || !rawKey.includes(':')) {
    return null
  }

  const [namespace, key] = rawKey.split(/:(.+)/)

  if (!namespace || !key) {
    return null
  }

  return { namespace, key }
}

export const hasKeyOrPrefix = (data, key) =>
  data?.[key] !== undefined ||
  Object.keys(data ?? {}).some(existing => existing.startsWith(`${key}.`))
