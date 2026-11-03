import { afterEach, describe, expect, test, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { useMapLabelDeclutter } from '../../src/components/overworld/useMapLabelDeclutter'

const box = (left, top, width, height) => ({
  left,
  top,
  right: left + width,
  bottom: top + height,
  width,
  height
})

const Probe = ({ container, enabled = true }) => {
  useMapLabelDeclutter({ current: container }, enabled, null, null)
  return null
}

const fixture = () => {
  const container = document.createElement('div')
  container.innerHTML = `
    <div class="map-node" data-label-priority="1">
      <div data-map-node-hex></div>
      <div data-testid="map-node-label"><span>Destination</span></div>
    </div>
    <div class="map-node"><div data-map-node-hex></div></div>`
  document.body.append(container)
  const [destination, other] = container.querySelectorAll('.map-node')
  const label = destination.querySelector('[data-testid="map-node-label"]')
  vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(
    box(0, 0, 200, 200)
  )
  vi.spyOn(destination, 'getBoundingClientRect').mockReturnValue(
    box(80, 40, 64, 80)
  )
  vi.spyOn(other, 'getBoundingClientRect').mockReturnValue(box(80, 90, 64, 80))
  vi.spyOn(label, 'getBoundingClientRect').mockReturnValue(box(88, 108, 48, 22))
  vi.spyOn(label.firstElementChild, 'getBoundingClientRect').mockReturnValue(
    box(88, 108, 48, 22)
  )
  for (const hex of container.querySelectorAll('[data-map-node-hex]')) {
    // Motion scales the visible box to zero on mount, but layout is already 48px.
    vi.spyOn(hex, 'getBoundingClientRect').mockReturnValue(box(112, 130, 0, 0))
    Object.defineProperties(hex, {
      offsetWidth: { value: 48 },
      offsetHeight: { value: 48 }
    })
  }
  return { container, label }
}

afterEach(() => {
  vi.restoreAllMocks()
  document
    .querySelectorAll('.map-node')
    .forEach(node => node.parentElement?.remove())
})

describe('useMapLabelDeclutter', () => {
  test('reserves the final hex footprint before its reveal animation finishes', () => {
    const { container, label } = fixture()
    render(<Probe container={container} />)
    expect(label.getAttribute('data-label-anchor')).toBe('above')
    expect(label.hasAttribute('data-declutter-hidden')).toBe(false)
  })

  test('tries separated fallback rows when both near anchors are blocked on desktop', () => {
    const { container, label } = fixture()
    const upper = document.createElement('div')
    upper.className = 'map-node'
    upper.innerHTML = '<div data-map-node-hex></div>'
    container.append(upper)
    vi.spyOn(upper, 'getBoundingClientRect').mockReturnValue(box(80, 0, 64, 80))
    Object.defineProperties(upper.firstElementChild, {
      offsetWidth: { value: 48 },
      offsetHeight: { value: 48 }
    })
    render(<Probe container={container} />)
    expect(label.getAttribute('data-label-anchor')).toBe('below')
    expect(label.style.getPropertyValue('--map-label-gap')).toBe('90px')
    expect(label.hasAttribute('data-declutter-hidden')).toBe(false)
  })

  test('avoids the fixed menu and updates placement when the scene scrolls', () => {
    const { container, label } = fixture()
    const menu = document.createElement('div')
    menu.className = 'ow-menu'
    menu.innerHTML = '<button>OPEN MENU</button>'
    document.body.append(menu)
    const menuBox = vi
      .spyOn(menu.firstElementChild, 'getBoundingClientRect')
      .mockReturnValue(box(0, 20, 200, 36))
    const { unmount } = render(<Probe container={container} />)
    // The near-above candidate hits the menu; the other hex blocks near-below.
    expect(label.getAttribute('data-label-anchor')).toBe('below')
    expect(label.style.getPropertyValue('--map-label-gap')).toBe('90px')
    expect(label.hasAttribute('data-declutter-hidden')).toBe(false)
    menuBox.mockReturnValue(box(0, 160, 200, 36))
    act(() => container.dispatchEvent(new Event('scroll')))
    expect(label.getAttribute('data-label-anchor')).toBe('above')
    expect(label.style.getPropertyValue('--map-label-gap')).toBe('28px')
    unmount()
    menu.remove()
  })

  test('places a name below the HUD edge when all standard rows are blocked', () => {
    const { container, label } = fixture()
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(
      box(0, 0, 200, 300)
    )
    const menu = document.createElement('div')
    menu.className = 'ow-menu'
    menu.innerHTML = '<button>OPEN MENU</button>'
    document.body.append(menu)
    vi.spyOn(menu.firstElementChild, 'getBoundingClientRect').mockReturnValue(
      box(0, 0, 200, 260)
    )
    render(<Probe container={container} />)
    expect(label.hasAttribute('data-declutter-hidden')).toBe(false)
    expect(label.getAttribute('data-label-anchor')).toBe('below')
    // Base name top is 108px; shift it to 264px, four pixels below the HUD.
    expect(label.style.getPropertyValue('--map-label-gap')).toBe('184px')
    menu.remove()
  })

  test('uses the map edge when the clear band beside the HUD has less than four pixels spare', () => {
    const { container, label } = fixture()
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(
      box(0, 0, 200, 285)
    )
    const menu = document.createElement('div')
    menu.className = 'ow-menu'
    menu.innerHTML = '<button>OPEN MENU</button>'
    document.body.append(menu)
    vi.spyOn(menu.firstElementChild, 'getBoundingClientRect').mockReturnValue(
      box(0, 0, 200, 260)
    )
    render(<Probe container={container} />)
    expect(label.hasAttribute('data-declutter-hidden')).toBe(false)
    expect(label.getAttribute('data-label-anchor')).toBe('below')
    expect(label.style.getPropertyValue('--map-label-gap')).toBe('183px')
    menu.remove()
  })

  test('reserves the hovered hex footprint beyond its unscaled bounds', () => {
    const { container, label } = fixture()
    const other = container.querySelectorAll('.map-node')[1]
    other.getBoundingClientRect.mockReturnValue(box(80, 117, 64, 80))
    render(<Probe container={container} />)
    expect(label.getAttribute('data-label-anchor')).toBe('above')
  })

  test('avoids the shortcuts control independently of its translated label', () => {
    const { container, label } = fixture()
    const button = document.createElement('button')
    button.setAttribute('data-shortcuts-toggle', '')
    button.setAttribute('aria-label', 'Tastaturkürzel')
    document.body.append(button)
    vi.spyOn(button, 'getBoundingClientRect').mockReturnValue(
      box(0, 20, 200, 36)
    )
    render(<Probe container={container} />)
    expect(label.getAttribute('data-label-anchor')).toBe('below')
    expect(label.style.getPropertyValue('--map-label-gap')).toBe('90px')
    button.remove()
  })

  test('clears placement flags when disabled', () => {
    const { container, label } = fixture()
    const { rerender } = render(<Probe container={container} />)
    label.setAttribute('data-declutter-hidden', 'true')
    rerender(<Probe container={container} enabled={false} />)
    expect(label.hasAttribute('data-label-anchor')).toBe(false)
    expect(label.hasAttribute('data-declutter-hidden')).toBe(false)
  })
})
