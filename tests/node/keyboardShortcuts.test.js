import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.join(__dirname, '..', '..')

test('KeyboardShortcutsPanel supports optional onClose prop and renders close button when provided', async () => {
  const filePath = path.join(
    REPO_ROOT,
    'src',
    'ui',
    'shared',
    'KeyboardShortcuts.tsx'
  )
  const content = await fs.readFile(filePath, 'utf8')

  // Verify onClose prop in interface
  assert.ok(
    content.includes('onClose?: () => void'),
    'KeyboardShortcutsPanelProps must include optional onClose prop'
  )

  // Verify close button with aria-label
  assert.ok(
    content.includes("aria-label={t('ui:shortcuts.closeAria'"),
    'KeyboardShortcutsPanel must use shortcuts.closeAria translation key'
  )

  // Verify button handles onClick={onClose}
  assert.ok(
    content.includes('onClick={onClose}'),
    'Close button must handle onClick={onClose}'
  )

  // Verify button uses type="button"
  assert.ok(
    content.includes("type='button'"),
    'Close button must declare type="button"'
  )
})
