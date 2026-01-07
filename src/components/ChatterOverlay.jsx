import React, { useState, useEffect, useRef } from 'react';
import { useGameState } from '../context/GameState';
import { getRandomChatter } from '../data/chatter';
import { motion, AnimatePresence } from 'framer-motion';

export const ChatterOverlay = () => {
    const state = useGameState(); // Get full state
    const stateRef = useRef(state); // Keep ref to latest state to avoid re-running effect
    const [chatter, setChatter] = useState(null);

    // Update ref whenever state changes
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    useEffect(() => {
        let timeoutId;
        let active = true;

        const loop = () => {
            if (!active) return;

            // Random delay: 8s to 25s
            const delay = Math.random() * 17000 + 8000;

            timeoutId = setTimeout(() => {
                if (!active) return;
                
                const currentState = stateRef.current;
                const result = getRandomChatter(currentState);

                if (result) {
                    const { text, speaker: fixedSpeaker } = result;

                    // Use fixed speaker if defined, else pick random member
                    let speaker = fixedSpeaker;
                    if (!speaker && currentState.band && currentState.band.members) {
                        const members = currentState.band.members.map(m => m.name);
                        speaker = members[Math.floor(Math.random() * members.length)];
                    }

                    setChatter({ text, speaker: speaker || 'Band', id: Date.now() });

                    // Hide after 5s
                    setTimeout(() => {
                        if (active) setChatter(null);
                    }, 5000);
                }

                // Schedule next
                loop();
            }, delay);
        };

        loop();

        return () => {
            active = false;
            clearTimeout(timeoutId);
        };
    }, []); // Run once on mount

    return (
        <AnimatePresence>
            {chatter && (
                <motion.div 
                    key={chatter.id}
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[150%] z-40 pointer-events-none"
                >
                    <div className="bg-white text-black p-3 rounded-tr-xl rounded-tl-xl rounded-bl-xl border-2 border-black shadow-lg max-w-[200px] md:max-w-xs relative">
                        <div className="flex justify-between items-center mb-1">
                             <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{chatter.speaker}</div>
                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        </div>
                        <div className="font-mono text-sm leading-tight">{chatter.text}</div>

                        {/* Triangle tail */}
                        <div className="absolute -bottom-2 right-4 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-white border-r-[0px] border-r-transparent filter drop-shadow-sm"></div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
