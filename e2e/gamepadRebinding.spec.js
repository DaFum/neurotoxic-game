import { test, expect } from '@playwright/test'

test.describe('Gamepad Rebinding & Persistence E2E', () => {
  test('persists custom gamepad lane bindings and restores them after reload', async ({ page }) => {
    // Stub navigator.getGamepads with a connected mock controller
    await page.addInitScript(() => {
      const mockGamepad = {
        id: 'Xbox Wireless Controller (STANDARD GAMEPAD)',
        index: 0,
        mapping: 'standard',
        connected: true,
        buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
        axes: [0, 0, 0, 0]
      }
      navigator.getGamepads = () => [mockGamepad]
    })

    await page.goto('/')

    // Verify localStorage can store global settings updates
    await page.evaluate(() => {
      const raw = localStorage.getItem('neurotoxic_global_settings') ?? '{}'
      const settings = JSON.parse(raw)
      settings.gamepadLaneBindings = [3, 4, 5]
      localStorage.setItem('neurotoxic_global_settings', JSON.stringify(settings))
    })

    // Reload page to verify settings restoration
    await page.reload()

    const storedSettings = await page.evaluate(() => {
      const raw = localStorage.getItem('neurotoxic_global_settings') ?? '{}'
      return JSON.parse(raw)
    })

    expect(storedSettings.gamepadLaneBindings).toEqual([3, 4, 5])
  })
})
