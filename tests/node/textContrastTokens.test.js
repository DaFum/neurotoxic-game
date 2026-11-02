import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

// WCAG 2.x AA minimum for normal-size text. Every label checked here is
// below 18.66px bold / 24px, so the large-text 3:1 exemption never applies.
const AA_NORMAL_TEXT = 4.5

const read = path => fs.readFile(new URL(path, import.meta.url), 'utf8')

/** @param {string} css */
const parseColorTokens = css => {
  /** @type {Map<string, number[]>} */
  const tokens = new Map()
  for (const [, name, hex] of css.matchAll(
    /--color-([a-z0-9-]+):\s*#([0-9a-f]{6})\s*;/gi
  )) {
    tokens.set(
      name,
      [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16))
    )
  }
  return tokens
}

/** @param {number} channel */
const linear = channel => {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** @param {number[]} rgb */
const luminance = ([r, g, b]) =>
  0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)

/**
 * @param {number[]} a
 * @param {number[]} b
 */
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * Composites `fg` at `alpha` over the opaque `bg`.
 *
 * @param {number[]} fg
 * @param {number[]} bg
 * @param {number} alpha
 */
const over = (fg, bg, alpha) =>
  fg.map((v, i) => v * alpha + bg[i] * (1 - alpha))

/**
 * Resolves the Tailwind colour utility `<prefix>-<token>[/<alpha>]` in a class
 * string against the parsed tokens (so `text-xs` is not mistaken for a colour).
 *
 * @param {Map<string, number[]>} tokens
 * @param {string} classes
 * @param {string} prefix - e.g. `text`, `hover:text`, `hover:bg`.
 */
const resolveUtility = (tokens, classes, prefix) => {
  for (const cls of classes.split(/\s+/)) {
    if (!cls.startsWith(`${prefix}-`)) continue
    const [name, alpha] = cls.slice(prefix.length + 1).split('/')
    const rgb = tokens.get(name)
    if (rgb) return { name, rgb, alpha: alpha ? Number(alpha) / 100 : 1 }
  }
  assert.fail(`no ${prefix}-<colour token> in "${classes}"`)
}

/**
 * Returns the static className of the element whose first child is the given
 * i18n key, e.g. `<span className='...'>{t('ui:pregig.nrg')}`.
 *
 * @param {string} source
 * @param {string} key
 */
const classNameBefore = (source, key) => {
  const escaped = key.replace(/[.:]/g, m => `\\${m}`)
  const match = source.match(
    new RegExp(`className='([^']*)'\\s*>\\s*\\{t\\('${escaped}'`)
  )
  assert.ok(match, `className for ${key} not found`)
  return match[1]
}

test('text-contrast fixes (#3499) keep WCAG AA against their backgrounds', async () => {
  const [css, bandHq, hud, setlist] = await Promise.all([
    read('../../src/index.css'),
    read('../../src/ui/BandHQ.tsx'),
    read('../../src/ui/overworld/OverworldHUD.tsx'),
    read('../../src/components/pregig/SetlistBlock.tsx')
  ])
  const tokens = parseColorTokens(css)
  const voidBlack = tokens.get('void-black')
  assert.ok(voidBlack, 'void-black token missing')

  /**
   * @param {string} label
   * @param {{ rgb: number[], alpha: number }} text
   * @param {number[]} background - opaque background.
   */
  const expectAA = (label, text, background) => {
    const ratio = contrast(over(text.rgb, background, text.alpha), background)
    assert.ok(
      ratio >= AA_NORMAL_TEXT,
      `${label}: ${ratio.toFixed(2)}:1 is below ${AA_NORMAL_TEXT}:1`
    )
  }

  // HQ Leave sits in the modal header (bg-void-black); hover inverts it.
  const leave = classNameBefore(bandHq, 'ui:hq.leave')
  expectAA('HQ Leave', resolveUtility(tokens, leave, 'text'), voidBlack)
  const hoverBg = resolveUtility(tokens, leave, 'hover:bg')
  assert.equal(hoverBg.alpha, 1, 'hover background must be opaque')
  expectAA(
    'HQ Leave (hover)',
    resolveUtility(tokens, leave, 'hover:text'),
    hoverBg.rgb
  )

  // Overworld career readout labels sit on a bg-void-black chip.
  for (const key of [
    'ui:overworld.career_fame',
    'ui:overworld.career_level',
    'ui:overworld.career_dist'
  ]) {
    expectAA(
      key,
      resolveUtility(tokens, classNameBefore(hud, key), 'text'),
      voidBlack
    )
  }

  // PreGig NRG label: unselected rows have no fill, selected and locked rows
  // tint the void-black page with toxic-green/10 and blood-red/10.
  const nrg = resolveUtility(
    tokens,
    classNameBefore(setlist, 'ui:pregig.nrg'),
    'text'
  )
  /** @param {string} fillClass */
  const rowFill = fillClass => {
    assert.ok(setlist.includes(fillClass), `${fillClass} no longer used`)
    const fill = resolveUtility(tokens, fillClass, 'bg')
    return over(fill.rgb, voidBlack, fill.alpha)
  }
  const rowFills = {
    unselected: voidBlack,
    selected: rowFill('bg-toxic-green/10'),
    locked: rowFill('bg-blood-red/10')
  }
  for (const [state, fill] of Object.entries(rowFills)) {
    expectAA(`NRG label (${state} row)`, nrg, fill)
  }
})
