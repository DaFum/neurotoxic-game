import React, { useEffect } from 'react';
import { useGameState } from '../context/GameState';
import { useRhythmGameLogic } from '../hooks/useRhythmGameLogic';
import { PixiStage } from '../components/PixiStage';
import { GigHUD } from '../components/GigHUD';
import { IMG_PROMPTS, getGenImageUrl } from '../utils/imageGen';
import PropTypes from 'prop-types';

export const Gig = () => {
  const { currentGig } = useGameState();

  // Use the extracted logic hook
  const logic = useRhythmGameLogic();
  const { stats, actions, gameStateRef } = logic;

  // Keyboard Event Handling
  useEffect(() => {
    const handleKeyDown = (e) => {
        const laneIndex = gameStateRef.current.lanes.findIndex(l => l.key === e.key);
        if (laneIndex !== -1) {
            actions.registerInput(laneIndex, true);
            triggerBandAnimation(laneIndex);
        }
    };

    const handleKeyUp = (e) => {
        const laneIndex = gameStateRef.current.lanes.findIndex(l => l.key === e.key);
        if (laneIndex !== -1) {
            actions.registerInput(laneIndex, false);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [actions, gameStateRef]);

  const triggerBandAnimation = (laneIndex) => {
      const memberEl = document.getElementById(`band-member-${laneIndex}`);
      if (memberEl) {
          memberEl.classList.remove('animate-headbang');
          void memberEl.offsetWidth; // Trigger reflow
          memberEl.classList.add('animate-headbang');
      }
  };

  // Touch/Mouse Input Handlers for Columns
  const handleTouchStart = (laneIndex) => {
      actions.registerInput(laneIndex, true);
      triggerBandAnimation(laneIndex);
  };

  const handleTouchEnd = (laneIndex) => {
      actions.registerInput(laneIndex, false);
  };

  // Determine Background URL
  let bgPrompt = IMG_PROMPTS.VENUE_CLUB;
  if (currentGig?.name?.includes("Kaminstube")) bgPrompt = IMG_PROMPTS.VENUE_KAMINSTUBE;
  else if (currentGig?.name?.includes("Festival") || currentGig?.name?.includes("Open Air")) bgPrompt = IMG_PROMPTS.VENUE_FESTIVAL;
  else if (currentGig?.diff <= 2) bgPrompt = IMG_PROMPTS.VENUE_DIVE_BAR;
  else if (currentGig?.diff >= 5) bgPrompt = IMG_PROMPTS.VENUE_GALACTIC;
  
  const bgUrl = getGenImageUrl(bgPrompt);

  return (
    <div className={`w-full h-full relative bg-black flex flex-col overflow-hidden ${stats.isToxicMode ? 'border-4 border-[var(--toxic-green)] animate-pulse' : ''}`}>
      
      {/* Layer 0: Background */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-50"
        style={{ backgroundImage: `url("${bgUrl}")` }}
      ></div>

      {/* Layer 1: Band Members (DOM) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
          {/* Matze (Guitar) - Left */}
          <div id="band-member-0" className="absolute left-[15%] top-[30%] w-32 h-48 transition-transform duration-100">
              <img src={getGenImageUrl(IMG_PROMPTS.MATZE_PLAYING)} alt="Matze" className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]" />
          </div>
          {/* Lars (Drums) - Center Back */}
          <div id="band-member-1" className="absolute left-[50%] top-[20%] -translate-x-1/2 w-40 h-40 transition-transform duration-100">
              <img src={getGenImageUrl(IMG_PROMPTS.LARS_PLAYING)} alt="Lars" className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(0,255,65,0.5)]" />
          </div>
          {/* Marius (Bass) - Right */}
          <div id="band-member-2" className="absolute right-[15%] top-[30%] w-32 h-48 transition-transform duration-100">
              <img src={getGenImageUrl(IMG_PROMPTS.MARIUS_PLAYING)} alt="Marius" className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(0,65,255,0.5)]" />
          </div>
      </div>

      {/* Layer 2: Pixi Canvas (Notes) */}
      <PixiStage logic={logic} />

      {/* Layer 3 & 4: HUD & Inputs */}
      <GigHUD 
          stats={stats} 
          onLaneInput={(index, active) => active ? handleTouchStart(index) : handleTouchEnd(index)}
      />

    </div>
  );
};

Gig.propTypes = {
    // Current Gig is validated in logic mostly, but good to have
};
