import React, { useState, useEffect } from 'react';
import { MainMenu } from './scenes/MainMenu';
import { Overworld } from './scenes/Overworld';
import { Gig } from './scenes/Gig';
import { PreGig } from './scenes/PreGig';
import { PostGig } from './scenes/PostGig';
import { Settings } from './scenes/Settings';
import { Credits } from './scenes/Credits';
import { GameOver } from './scenes/GameOver';
import { HUD } from './ui/HUD';
import { EventModal } from './ui/EventModal';
import { ToastOverlay } from './ui/ToastOverlay';
import { TutorialManager } from './components/TutorialManager';
import { GameStateProvider, useGameState } from './context/GameState';

function GameContent() {
  const { currentScene, activeEvent, resolveEvent, settings } = useGameState();

  const renderScene = () => {
    switch (currentScene) {
      case 'MENU':
        return <MainMenu />;
      case 'SETTINGS':
        return <Settings />;
      case 'CREDITS':
        return <Credits />;
      case 'GAMEOVER':
        return <GameOver />;
      case 'OVERWORLD':
        return <Overworld />;
      case 'PREGIG':
        return <PreGig />;
      case 'GIG':
        return <Gig />;
      case 'POSTGIG':
        return <PostGig />;
      default:
        return <MainMenu />;
    }
  };

  return (
    <div className="game-container relative w-full h-full overflow-hidden bg-black text-green-500">
      {settings.crtEnabled && (
        <div className="crt-overlay pointer-events-none fixed inset-0 z-50 mix-blend-overlay opacity-50"></div>
      )}
      
      {/* Hide HUD in Menu/Settings/Credits/GameOver */}
      {!['MENU', 'SETTINGS', 'CREDITS', 'GAMEOVER'].includes(currentScene) && <HUD />}
      
      <ToastOverlay />
      <TutorialManager />
      
      {/* Global Event Modal Overlay */}
      {activeEvent && (
        <EventModal 
            event={activeEvent} 
            onOptionSelect={resolveEvent} 
        />
      )}

      {renderScene()}
    </div>
  );
}

export default function App() {
  return (
    <GameStateProvider>
      <GameContent />
    </GameStateProvider>
  );
}
