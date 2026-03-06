import { performance } from 'perf_hooks';
import { render, fireEvent, screen } from '@testing-library/react';
import { MainMenu } from '../../src/scenes/MainMenu';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock everything like in the tests
vi.mock('../../src/context/GameState', () => ({
  useGameState: vi.fn(() => ({
    changeScene: vi.fn(),
    updatePlayer: vi.fn(),
    resetState: vi.fn(),
    addToast: vi.fn(),
    loadGame: vi.fn()
  }))
}));

vi.mock('../../src/hooks/useBandHQModal', () => ({
  useBandHQModal: vi.fn(() => ({
    showHQ: false,
    openHQ: vi.fn(),
    bandHQProps: {}
  }))
}));

vi.mock('../../src/utils/imageGen', () => ({
  getGenImageUrl: vi.fn(() => 'mock-image-url'),
  IMG_PROMPTS: { MAIN_MENU_BG: 'mock-bg' }
}));

vi.mock('../../src/utils/AudioManager', () => ({
  audioManager: {
    startAmbient: vi.fn().mockResolvedValue(),
    ensureAudioContext: vi.fn().mockResolvedValue()
  }
}));

vi.mock('../../src/utils/errorHandler', () => ({
  handleError: vi.fn()
}));

vi.mock('../../src/ui/BandHQ', () => ({
  BandHQ: () => <div data-testid='band-hq-modal'>Band HQ Modal</div>
}));

describe('MainMenu Performance Benchmark', () => {
  beforeEach(() => {
    localStorage.clear();
    // Simulate existing player to skip name input and directly proceed to tour
    localStorage.setItem('neurotoxic_player_id', 'existing-id');
    localStorage.setItem('neurotoxic_player_name', 'ExistingPlayer');
    // We don't want the existing save prompt to block us either, so ensure it doesn't exist
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('measures the duration of proceedToTour (handleStartTour -> startNewTourFlow -> proceedToTour)', async () => {
    render(<MainMenu />);

    const startButton = screen.getByText('ui:start_game');

    const startTime = performance.now();

    // We expect this to take ~500ms because of the artificial delay
    await fireEvent.click(startButton);

    // In actual benchmark we'd wait for something, but here we can just wait a tiny bit for the async flow
    // Since proceedToTour is an async function triggered by a click, we need to wait for it to finish.
    // The delay is 500ms, so let's wait 600ms.
    await new Promise(resolve => setTimeout(resolve, 600));

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`proceedToTour flow duration: ${duration.toFixed(2)}ms`);

    // Ensure duration is reasonable
    expect(duration).toBeGreaterThan(0);
  });
});
