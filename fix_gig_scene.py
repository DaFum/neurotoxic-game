import re

with open('tests/Gig.scene.test.jsx', 'r') as f:
    content = f.read()

# Add flushPromises to the initialize audio button calls ensureAudioContext test
helper = """
const flushPromises = async () => {
  await Promise.resolve()
  await Promise.resolve()
}
"""
content = content.replace("describe('Gig Scene Component', () => {", helper + "\ndescribe('Gig Scene Component', () => {")

content = content.replace("""    test('initialize audio button calls ensureAudioContext', async () => {
      const mockRetry = vi.fn()
      useRhythmGameLogic.mockReturnValue({
        stats: { isAudioReady: false },
        actions: { retryAudioInitialization: mockRetry },
        gameStateRef: { current: {} },
        update: vi.fn()
      })

      audioManager.ensureAudioContext.mockResolvedValue(true)

      render(<Gig />)

      const initButton = screen.getByText(/INITIALIZE AUDIO/i)
      await act(async () => {
        fireEvent.click(initButton)
      })

      expect(audioManager.ensureAudioContext).toHaveBeenCalled()
      expect(mockRetry).toHaveBeenCalled()
    })""", """    test('initialize audio button calls ensureAudioContext', async () => {
      const mockRetry = vi.fn()
      useRhythmGameLogic.mockReturnValue({
        stats: { isAudioReady: false },
        actions: { retryAudioInitialization: mockRetry },
        gameStateRef: { current: {} },
        update: vi.fn()
      })

      audioManager.ensureAudioContext.mockResolvedValue(true)

      render(<Gig />)

      const initButton = screen.getByText(/INITIALIZE AUDIO/i)
      await act(async () => {
        fireEvent.click(initButton)
      })

      await flushPromises()
      expect(audioManager.ensureAudioContext).toHaveBeenCalled()
      expect(mockRetry).toHaveBeenCalled()
    })""")

with open('tests/Gig.scene.test.jsx', 'w') as f:
    f.write(content)
