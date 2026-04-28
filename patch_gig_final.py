import re

with open('tests/ui/Gig.scene.test.jsx', 'r') as f:
    content = f.read()

# It looks like there's an orphaned block from the old Edge Cases describe
orphaned_block = """      expect(() => render(<Gig />)).not.toThrow()
    })

    test('handles missing currentGig diff gracefully', () => {
      useGameState.mockReturnValue({
        currentGig: { id: 'gig', name: 'Test' },
        changeScene: mockChangeScene,
        addToast: mockAddToast,
        setActiveEvent: mockSetActiveEvent,
        setLastGigStats: mockSetLastGigStats,
        band: { harmony: 70 },
        endGig: mockEndGig
      })

      expect(() => render(<Gig />)).not.toThrow()
    })

    test('renders with minimum required props', () => {
      useGameState.mockReturnValue({
        currentGig: { id: 'gig' },
        changeScene: mockChangeScene,
        addToast: mockAddToast,
        setActiveEvent: mockSetActiveEvent,
        setLastGigStats: mockSetLastGigStats,
        band: { harmony: 50 },
        endGig: mockEndGig
      })

      expect(() => render(<Gig />)).not.toThrow()
    })

    test('handles festival venue names correctly', () => {
      useGameState.mockReturnValue({
        currentGig: { id: 'gig', name: 'Summer Festival', diff: 5 },
        changeScene: mockChangeScene,
        addToast: mockAddToast,
        setActiveEvent: mockSetActiveEvent,
        setLastGigStats: mockSetLastGigStats,
        band: { harmony: 70 },
        endGig: mockEndGig
      })

      expect(() => render(<Gig />)).not.toThrow()
    })

    test('handles open air venue names correctly', () => {
      useGameState.mockReturnValue({
        currentGig: { id: 'gig', name: 'Open Air Stage', diff: 4 },
        changeScene: mockChangeScene,
        addToast: mockAddToast,
        setActiveEvent: mockSetActiveEvent,
        setLastGigStats: mockSetLastGigStats,
        band: { harmony: 70 },
        endGig: mockEndGig
      })

      expect(() => render(<Gig />)).not.toThrow()
    })
  })"""

content = content.replace(orphaned_block, "")
content = content + "\n})\n" # Add the final closing brace back since the file might be missing it due to all the regexes

with open('tests/ui/Gig.scene.test.jsx', 'w') as f:
    f.write(content)
