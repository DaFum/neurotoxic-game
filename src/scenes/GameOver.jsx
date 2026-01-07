import React from 'react';
import { useGameState } from '../context/GameState';
import { GlitchButton } from '../ui/GlitchButton';

export const GameOver = () => {
    const { changeScene, player, loadGame, lastGigStats } = useGameState();

    const handleRetry = () => {
        if (loadGame()) {
            // Already handled by loadGame logic which sets scene to OVERWORLD usually
        } else {
            changeScene('MENU');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-black z-50 text-center p-8">
            <h1 className="text-8xl text-red-600 font-[Metal_Mania] mb-4 animate-bounce">SOLD OUT</h1>
            <h2 className="text-2xl text-gray-400 font-mono mb-12 uppercase tracking-widest">
                The tour has ended prematurely.
            </h2>

            <div className="border border-red-900 p-8 w-full max-w-lg mb-8 bg-red-900/10">
                <div className="grid grid-cols-2 gap-4 text-left font-mono text-lg">
                    <span className="text-gray-500">DAYS SURVIVED:</span>
                    <span className="text-white text-right">{player.day}</span>
                    
                    <span className="text-gray-500">FAME REACHED:</span>
                    <span className="text-white text-right">{player.fame}</span>

                    <span className="text-gray-500">LOCATION:</span>
                    <span className="text-white text-right">{player.location}</span>
                </div>
            </div>

            <div className="flex gap-4">
                <GlitchButton onClick={handleRetry} className="border-white text-white">
                    LOAD LAST SAVE
                </GlitchButton>
                <GlitchButton onClick={() => changeScene('MENU')} className="border-red-600 text-red-600">
                    GIVE UP
                </GlitchButton>
            </div>
        </div>
    );
};
