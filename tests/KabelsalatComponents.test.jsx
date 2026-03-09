import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Header } from '../src/scenes/kabelsalat/components/Header'
import { Rules } from '../src/scenes/kabelsalat/components/Rules'
import { Overlays } from '../src/scenes/kabelsalat/components/Overlays'
import { RackScrew } from '../src/scenes/kabelsalat/components/HardwareProps'
import { PlugGraphics } from '../src/scenes/kabelsalat/components/PlugGraphics'
import { SocketGraphics } from '../src/scenes/kabelsalat/components/SocketGraphics'

const mockT = (key, options) => {
  if (options?.count !== undefined) {
    return `${key}:${options.count}`
  }
  return options?.defaultValue || key
}

describe('Kabelsalat Components', () => {
  describe('Header', () => {
    it('renders title', () => {
      render(
        <Header
          t={mockT}
          isShocked={false}
          isPoweredOn={false}
          isGameOver={false}
          timeLeft={25}
        />
      )

      expect(
        screen.getByText('ui:minigames.kabelsalat.title')
      ).toBeInTheDocument()
    })

    it('renders status label', () => {
      render(
        <Header
          t={mockT}
          isShocked={false}
          isPoweredOn={false}
          isGameOver={false}
          timeLeft={25}
        />
      )

      expect(
        screen.getByText(/ui:minigames.kabelsalat.status/)
      ).toBeInTheDocument()
    })

    it('shows pending status when not powered and not game over', () => {
      render(
        <Header
          t={mockT}
          isShocked={false}
          isPoweredOn={false}
          isGameOver={false}
          timeLeft={25}
        />
      )

      expect(
        screen.getByText(/ui:minigames.kabelsalat.statusPending/)
      ).toBeInTheDocument()
    })

    it('shows connected status when powered on', () => {
      render(
        <Header
          t={mockT}
          isShocked={false}
          isPoweredOn={true}
          isGameOver={false}
          timeLeft={25}
        />
      )

      expect(
        screen.getByText(/ui:minigames.kabelsalat.statusConnected/)
      ).toBeInTheDocument()
    })

    it('shows failed status when game over', () => {
      render(
        <Header
          t={mockT}
          isShocked={false}
          isPoweredOn={false}
          isGameOver={true}
          timeLeft={0}
        />
      )

      expect(
        screen.getByText(/ui:minigames.kabelsalat.statusFailed/)
      ).toBeInTheDocument()
    })

    it('renders timer with correct time', () => {
      render(
        <Header
          t={mockT}
          isShocked={false}
          isPoweredOn={false}
          isGameOver={false}
          timeLeft={15}
        />
      )

      expect(
        screen.getByText('ui:minigames.kabelsalat.timeValue:15')
      ).toBeInTheDocument()
    })

    it('renders glitch effect on title when shocked', () => {
      const { container } = render(
        <Header
          t={mockT}
          isShocked={true}
          isPoweredOn={false}
          isGameOver={false}
          timeLeft={25}
        />
      )

      const titles = container.querySelectorAll('h2 span')
      expect(titles.length).toBeGreaterThan(1)
    })
  })

  describe('Rules', () => {
    it('renders rules title', () => {
      render(<Rules t={mockT} />)

      expect(
        screen.getByText(/ui:minigames.kabelsalat.rulesTitle/)
      ).toBeInTheDocument()
    })

    it('renders time rule', () => {
      render(<Rules t={mockT} />)

      expect(
        screen.getByText('ui:minigames.kabelsalat.rules.time')
      ).toBeInTheDocument()
    })

    it('renders rule 1 label and text', () => {
      render(<Rules t={mockT} />)

      expect(
        screen.getByText(/ui:minigames.kabelsalat.rules.rule1Label/)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/ui:minigames.kabelsalat.rules.rule1Text/)
      ).toBeInTheDocument()
    })

    it('renders rule 2 label and text', () => {
      render(<Rules t={mockT} />)

      expect(
        screen.getByText(/ui:minigames.kabelsalat.rules.rule2Label/)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/ui:minigames.kabelsalat.rules.rule2Text/)
      ).toBeInTheDocument()
    })

    it('renders penalty text', () => {
      render(<Rules t={mockT} />)

      expect(
        screen.getByText('ui:minigames.kabelsalat.rules.penalty')
      ).toBeInTheDocument()
    })

    it('renders as a list', () => {
      const { container } = render(<Rules t={mockT} />)

      const list = container.querySelector('ul')
      expect(list).toBeTruthy()
    })
  })

  describe('Overlays', () => {
    it('renders nothing when no special state is active', () => {
      const { container } = render(
        <Overlays
          t={mockT}
          isShocked={false}
          isGameOver={false}
          isPoweredOn={false}
          faultReason=''
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('renders shock overlay when shocked', () => {
      render(
        <Overlays
          t={mockT}
          isShocked={true}
          isGameOver={false}
          isPoweredOn={false}
          faultReason='Test fault'
        />
      )

      expect(
        screen.getByText('ui:minigames.kabelsalat.systemShock')
      ).toBeInTheDocument()
      expect(screen.getByText('Test fault')).toBeInTheDocument()
    })

    it('renders game over overlay when time is up', () => {
      render(
        <Overlays
          t={mockT}
          isShocked={false}
          isGameOver={true}
          isPoweredOn={false}
          faultReason=''
        />
      )

      expect(
        screen.getByText('ui:minigames.kabelsalat.timeUp')
      ).toBeInTheDocument()
      expect(
        screen.getByText('ui:minigames.kabelsalat.managerMad')
      ).toBeInTheDocument()
    })

    it('does not show game over overlay when shocked', () => {
      render(
        <Overlays
          t={mockT}
          isShocked={true}
          isGameOver={true}
          isPoweredOn={false}
          faultReason='fault'
        />
      )

      expect(
        screen.queryByText('ui:minigames.kabelsalat.timeUp')
      ).not.toBeInTheDocument()
    })

    it('renders success overlay when powered on', () => {
      render(
        <Overlays
          t={mockT}
          isShocked={false}
          isGameOver={false}
          isPoweredOn={true}
          faultReason=''
        />
      )

      expect(
        screen.getByText('ui:minigames.kabelsalat.success')
      ).toBeInTheDocument()
      expect(
        screen.getByText('ui:minigames.kabelsalat.ampsReady')
      ).toBeInTheDocument()
    })
  })

  describe('RackScrew', () => {
    it('renders SVG group at correct position', () => {
      const { container } = render(
        <svg>
          <RackScrew x={50} y={100} />
        </svg>
      )

      const group = container.querySelector('g')
      expect(group).toBeTruthy()
      expect(group.getAttribute('transform')).toBe('translate(50, 100)')
    })

    it('renders circle element', () => {
      const { container } = render(
        <svg>
          <RackScrew x={0} y={0} />
        </svg>
      )

      const circle = container.querySelector('circle')
      expect(circle).toBeTruthy()
    })

    it('renders cross pattern with lines', () => {
      const { container } = render(
        <svg>
          <RackScrew x={0} y={0} />
        </svg>
      )

      const lines = container.querySelectorAll('line')
      expect(lines.length).toBe(2)
    })
  })

  describe('PlugGraphics', () => {
    it('renders XLR plug with 3 pins', () => {
      const { container } = render(
        <svg>
          <PlugGraphics type='xlr' />
        </svg>
      )

      const circles = container.querySelectorAll('circle')
      expect(circles.length).toBe(3)
    })

    it('renders jack plug with cylindrical body', () => {
      const { container } = render(
        <svg>
          <PlugGraphics type='jack' />
        </svg>
      )

      const rects = container.querySelectorAll('rect')
      expect(rects.length).toBeGreaterThan(0)
    })

    it('renders DC plug', () => {
      const { container } = render(
        <svg>
          <PlugGraphics type='dc' />
        </svg>
      )

      const rects = container.querySelectorAll('rect')
      expect(rects.length).toBeGreaterThan(0)
    })

    it('renders IEC power plug with 3 pins', () => {
      const { container } = render(
        <svg>
          <PlugGraphics type='iec' />
        </svg>
      )

      const rects = container.querySelectorAll('rect')
      expect(rects.length).toBe(3)
    })

    it('renders MIDI plug with 5 pins', () => {
      const { container } = render(
        <svg>
          <PlugGraphics type='midi' />
        </svg>
      )

      const circles = container.querySelectorAll('circle')
      expect(circles.length).toBe(6)
    })

    it('renders nothing for unknown type', () => {
      const { container } = render(
        <svg>
          <PlugGraphics type='unknown' />
        </svg>
      )

      const group = container.querySelector('g')
      expect(group).toBeNull()
    })
  })

  describe('SocketGraphics', () => {
    it('renders XLR socket with 3 holes', () => {
      const { container } = render(
        <svg>
          <SocketGraphics type='xlr' />
        </svg>
      )

      const circles = container.querySelectorAll('circle')
      expect(circles.length).toBe(4)
    })

    it('renders jack socket', () => {
      const { container } = render(
        <svg>
          <SocketGraphics type='jack' />
        </svg>
      )

      const polygon = container.querySelector('polygon')
      expect(polygon).toBeTruthy()
    })

    it('renders DC socket', () => {
      const { container } = render(
        <svg>
          <SocketGraphics type='dc' />
        </svg>
      )

      const rects = container.querySelectorAll('rect')
      expect(rects.length).toBeGreaterThan(0)
    })

    it('renders IEC power socket', () => {
      const { container } = render(
        <svg>
          <SocketGraphics type='iec' />
        </svg>
      )

      const rects = container.querySelectorAll('rect')
      expect(rects.length).toBe(3)
    })

    it('renders MIDI socket with circular housing', () => {
      const { container } = render(
        <svg>
          <SocketGraphics type='midi' />
        </svg>
      )

      const circles = container.querySelectorAll('circle')
      expect(circles.length).toBeGreaterThan(0)
    })

    it('renders nothing for unknown type', () => {
      const { container } = render(
        <svg>
          <SocketGraphics type='unknown' />
        </svg>
      )

      const group = container.querySelector('g')
      expect(group).toBeNull()
    })
  })
})
