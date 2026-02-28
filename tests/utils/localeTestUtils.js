import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

export const extractPlaceholders = value => {
  if (typeof value !== 'string') {
    return []
  }

  const matches = value.match(/{{\s*([\w.]+)\s*}}/g) ?? []
  return matches.map(match => match.replace(/{{\s*|\s*}}/g, ''))
}

export const flattenTranslations = (entry, parentKey = '') => {
  if (typeof entry === 'string') {
    return [{ key: parentKey, value: entry }]
  }

  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return []
  }

  return Object.entries(entry).flatMap(([childKey, childValue]) => {
    const nextKey = parentKey ? `${parentKey}.${childKey}` : childKey
    return flattenTranslations(childValue, nextKey)
  })
}

export const flattenTranslationsObj = (entry, parentKey = '') => {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return {}
  }

  return Object.entries(entry).reduce((accumulator, [childKey, childValue]) => {
    const nextKey = parentKey ? `${parentKey}.${childKey}` : childKey

    if (childValue && typeof childValue === 'object' && !Array.isArray(childValue)) {
      return { ...accumulator, ...flattenTranslationsObj(childValue, nextKey) }
    }

    return { ...accumulator, [nextKey]: childValue }
  }, {})
}

export const readLocaleJson = (directory, fileName) => {
  const localePath = path.join(directory, fileName)
  return JSON.parse(readFileSync(localePath, 'utf8'))
}

export const toKeyMap = flattened =>
  flattened.reduce((accumulator, item) => {
    accumulator.set(item.key, item.value)
    return accumulator
  }, new Map())

export const collectSourceFiles = directory => {
  const entries = readdirSync(directory, { withFileTypes: true })

  return entries.flatMap(entry => {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      return collectSourceFiles(entryPath)
    }

    return /\.(js|jsx|ts|tsx)$/.test(entry.name) ? [entryPath] : []
  })
}

export const resolveNamespaceKey = rawKey => {
  if (!rawKey || rawKey.endsWith(':')) {
    return null
  }

  if (rawKey.includes(':')) {
    const [namespace, key] = rawKey.split(/:(.+)/)

    if (!namespace || !key) {
      return null
    }

    return { namespace, key }
  }

  return { namespace: 'ui', key: rawKey }
}
