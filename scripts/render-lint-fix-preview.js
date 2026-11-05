#!/usr/bin/env node
// ESM — like analyze-duplicates.js, requires "type": "module".
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

export const MAX_COMMENT_SIZE = 65536
const PATCH_HEADING =
  '### Patch preview\n\n(Showing last 4000 lines if larger.)\n\n'
const NO_CHANGES =
  'No changes would be made by running either formatting or lint auto-fixes.\n\n'

/** @param {string} text @returns {number} */
function fenceSize(text) {
  let size = 3
  for (const match of text.matchAll(/`+/g)) {
    size = Math.max(size, match[0].length + 1)
  }
  return size
}

/** @param {string} text @param {number} length @returns {string} */
function safePrefix(text, length) {
  let end = Math.max(0, length)
  const last = text.charCodeAt(end - 1)
  const next = text.charCodeAt(end)
  if (last >= 0xd800 && last <= 0xdbff && next >= 0xdc00 && next <= 0xdfff)
    end--
  return text.slice(0, end)
}

/**
 * Render only presentation: eligibility always comes from the full inputs.
 * @param {{ header: string, patch: string, duplicates: string, hasDiff: boolean,
 *   runLink?: string, artifactName?: string, fixFailed?: boolean }} options
 * @returns {string}
 */
export function renderLintFixPreview({
  header,
  patch,
  duplicates,
  hasDiff,
  runLink,
  artifactName,
  fixFailed = false
}) {
  const noChanges = fixFailed
    ? 'Unresolved errors remain; the run did not pass.\n\n'
    : NO_CHANGES
  // Include a final newline in the payload without changing ordinary git diffs.
  const payload = patch && !patch.endsWith('\n') ? `${patch}\n` : patch
  const lines = payload ? payload.slice(0, -1).split('\n') : []
  const total = lines.length
  const hint = runLink
    ? ` Full report: [lint-fix-preview](${runLink}).`
    : artifactName
      ? ' Full report: lint-fix-preview artifact.'
      : ''
  /** @param {number} shown @returns {string} */
  const notice = shown =>
    `Patch truncated: showing ${shown} of ${total} lines (a shown line may be partial).${hint}\n\n`
  /** @param {string} text @param {string} note @returns {string} */
  const assemble = (text, note) => {
    const fence = '`'.repeat(fenceSize(text))
    return `${header}${PATCH_HEADING}${fence}diff\n${text}${fence}\n\n${note}${duplicates}`
  }
  const complete = hasDiff
    ? assemble(payload, '')
    : `${header}${noChanges}${duplicates}`
  if (complete.length <= MAX_COMMENT_SIZE && (!hasDiff || total <= 4000)) {
    return complete
  }

  const omission = hasDiff
    ? `${PATCH_HEADING}Patch omitted: showing 0 of ${total} lines (report size limit).${hint}\n\n`
    : noChanges
  const duplicateNotice = 'Duplicate findings omitted.\n'
  // Reserve every fixed section and the longest possible truncation notice.
  // Empty fences cost 13 code units: ```diff\n + ```\n\n.
  const budget =
    MAX_COMMENT_SIZE -
    header.length -
    PATCH_HEADING.length -
    duplicates.length -
    notice(total).length -
    13
  if (!hasDiff || budget < 1) {
    const available =
      MAX_COMMENT_SIZE -
      header.length -
      omission.length -
      duplicateNotice.length
    const prefix = duplicates.slice(0, Math.max(0, available))
    const boundary = prefix.lastIndexOf('\n') + 1
    const clipped =
      duplicates.length > Math.max(0, available)
        ? `${prefix.slice(0, boundary)}${duplicateNotice}`
        : duplicates
    // Headers are normally tiny; still bound malformed standalone CLI inputs.
    return safePrefix(`${header}${omission}${clipped}`, MAX_COMMENT_SIZE)
  }

  let retained = ''
  let shown = 0
  let longestFence = 3
  for (let index = total - 1; index >= Math.max(0, total - 4000); index--) {
    const line = `${lines[index] ?? ''}\n`
    const candidateFence = Math.max(longestFence, fenceSize(line))
    if (line.length + retained.length + 2 * (candidateFence - 3) > budget) break
    retained = line + retained
    longestFence = candidateFence
    shown++
  }
  if (shown === 0 && total > 0) {
    const last = lines[total - 1] ?? ''
    // Prefix length and its longest backtick run are monotone, so binary search
    // accounts for fence growth even when the last line is entirely backticks.
    let low = 0
    let high = Math.min(last.length, budget)
    while (low < high) {
      const middle = Math.ceil((low + high) / 2)
      const prefix = safePrefix(last, middle)
      if (prefix.length + 1 + 2 * (fenceSize(prefix) - 3) <= budget)
        low = middle
      else high = middle - 1
    }
    retained = `${safePrefix(last, low)}\n`
    shown = 1
  }
  return assemble(retained, notice(shown))
}

// CLI: header file, full patch file, duplicate findings file, has-diff, [run link], [fix-failed].
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const [headerFile, patchFile, duplicateFile, hasDiff, runLink, fixFailed] =
    process.argv.slice(2)
  if (!headerFile || !patchFile || !duplicateFile || !hasDiff) {
    console.error(
      'Usage: render-lint-fix-preview.js header patch duplicates has-diff [run-link] [fix-failed]'
    )
    process.exit(1)
  }
  process.stdout.write(
    renderLintFixPreview({
      header: fs.readFileSync(headerFile, 'utf8'),
      patch: fs.readFileSync(patchFile, 'utf8'),
      duplicates: fs.readFileSync(duplicateFile, 'utf8'),
      hasDiff: hasDiff === '1',
      fixFailed: fixFailed === '1',
      ...(runLink ? { runLink } : {})
    })
  )
}
