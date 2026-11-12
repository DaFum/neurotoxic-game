#!/usr/bin/env node

/**
 * Checks prompts marked as missing in output/bildabgleich.md against the
 * Pollinations image endpoint. Image responses are saved using the same
 * encoded filenames as src/assets/image; JSON responses are documented in a
 * separate report instead of being saved as image files.
 *
 * Usage:
 *   POLLINATIONS_API_KEY=... node scripts/check-missing-images.mjs
 *   POLLINATIONS_API_KEY=... node scripts/check-missing-images.mjs --limit 10
 *
 * The API key is intentionally read from the environment and never written
 * to logs or the result report.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const projectRoot = path.resolve(import.meta.dirname, '..')
const sourceReportPath = path.join(projectRoot, 'output', 'bildabgleich.md')
const imageDirectory = path.join(projectRoot, 'src', 'assets', 'image')
const resultReportPath = path.join(
  projectRoot,
  'output',
  'missing-images-check.json'
)

const apiKey = process.env.POLLINATIONS_API_KEY
const limitArgIndex = process.argv.indexOf('--limit')
const limit =
  limitArgIndex >= 0 ? Number.parseInt(process.argv[limitArgIndex + 1], 10) : 0
const timeoutMs = 30_000
const retryCount = 2
const requestDelayMs = 250

if (!apiKey) {
  console.error(
    'Missing POLLINATIONS_API_KEY. Set it in the environment; do not hardcode it in the script.'
  )
  process.exit(1)
}

if (limitArgIndex >= 0 && (!Number.isInteger(limit) || limit < 1)) {
  console.error('--limit must be a positive integer.')
  process.exit(1)
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const extractMissingPrompts = markdown => {
  const section = markdown.match(
    /## Noch fehlend\s*\n([\s\S]*?)(?=\n## |$)/
  )?.[1]

  if (!section) {
    throw new Error('Could not find the "## Noch fehlend" section in the report.')
  }

  return section
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(encodedPrompt => ({
      encodedPrompt,
      prompt: decodeURIComponent(encodedPrompt)
    }))
}

const buildEndpoint = prompt => {
  const encodedPrompt = encodeURIComponent(prompt)
  return `https://gen.pollinations.ai/image/${encodedPrompt}?model=flux&seed=666&key=${encodeURIComponent(apiKey)}&=`
}

const responseBodyForReport = async response => {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    try {
      return await response.json()
    } catch {
      return { raw: await response.text() }
    }
  }

  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text.slice(0, 10_000) }
  }
}

const checkPrompt = async item => {
  let lastError

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(buildEndpoint(item.prompt), {
        signal: controller.signal,
        headers: { Accept: 'image/*, application/json' }
      })
      clearTimeout(timeout)

      const contentType = response.headers.get('content-type') ?? ''
      if (response.ok && contentType.startsWith('image/')) {
        const image = Buffer.from(await response.arrayBuffer())
        await writeFile(path.join(imageDirectory, item.encodedPrompt), image)
        return {
          ...item,
          status: 'image-saved',
          httpStatus: response.status,
          contentType,
          bytes: image.byteLength
        }
      }

      const body = await responseBodyForReport(response)
      return {
        ...item,
        status: 'json-response',
        httpStatus: response.status,
        contentType,
        response: body
      }
    } catch (error) {
      clearTimeout(timeout)
      lastError = error
      if (attempt < retryCount) await sleep(1000 * (attempt + 1))
    }
  }

  return {
    ...item,
    status: 'request-error',
    error: lastError instanceof Error ? lastError.message : String(lastError)
  }
}

const run = async () => {
  const markdown = await readFile(sourceReportPath, 'utf8')
  const prompts = extractMissingPrompts(markdown)
  const selectedPrompts = limit ? prompts.slice(0, limit) : prompts
  const startedAt = new Date().toISOString()
  const results = []

  await mkdir(imageDirectory, { recursive: true })
  await mkdir(path.dirname(resultReportPath), { recursive: true })

  console.log(`Checking ${selectedPrompts.length} missing image prompts...`)

  for (const [index, item] of selectedPrompts.entries()) {
    const result = await checkPrompt(item)
    results.push(result)
    console.log(
      `[${index + 1}/${selectedPrompts.length}] ${result.status}: ${item.encodedPrompt}`
    )
    if (index < selectedPrompts.length - 1) await sleep(requestDelayMs)
  }

  const report = {
    checkedAt: new Date().toISOString(),
    startedAt,
    sourceReport: path.relative(projectRoot, sourceReportPath),
    endpoint: 'https://gen.pollinations.ai/image/{prompt}?model=flux&seed=666&key=[redacted]&=',
    totals: {
      checked: results.length,
      imageSaved: results.filter(result => result.status === 'image-saved').length,
      jsonResponses: results.filter(result => result.status === 'json-response').length,
      requestErrors: results.filter(result => result.status === 'request-error').length
    },
    results
  }

  await writeFile(resultReportPath, `${JSON.stringify(report, null, 2)}\n`)
  console.log(`Report written to ${path.relative(projectRoot, resultReportPath)}`)
}

run().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
