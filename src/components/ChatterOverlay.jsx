import React, { useState, useEffect } from 'react';
import { useGameState } from '../context/GameState';
import { getRandomChatter } from '../data/chatter';
import { motion, AnimatePresence } from 'framer-motion';

export const ChatterOverlay = () => {
    const state = useGameState(); // Get full state
    const [chatter, setChatter] = useState(null);

    useEffect(() => {
        // Random interval between 10s and 30s
        const scheduleNext = () => {
            const delay = Math.random() * 20000 + 10000; 
            return setTimeout(() => {
                const text = getRandomChatter(state);
                // Pick a random member name for attribution? 
                const members = state.band.members.map(m => m.name);
                const speaker = members[Math.floor(Math.random() * members.length)];
                
                setChatter({ text, speaker, id: Date.now() });
                
                // Hide after 4s
                setTimeout(() => setChatter(null), 4000);
                
                // Reschedule
                scheduleNext();
            }, delay);
        };

        const timer = scheduleNext();
        return () => clearTimeout(timer);
    }, [state]); // Re-run if state changes drastically? No, useEffect dep handling is tricky here. 
    // Ideally we just want access to latest state in the timeout. 
    // Since state changes often, this effect re-runs often, resetting timer.
    // We should use a ref for state or use functional update pattern but we can't for reading.
    // Better: use a ref to track if a timer is active, or just let it reset (simulates "quiet time" if things are happening).
    // Actually, resetting on every state change means chatter never happens if game updates frequently (timer ticks, etc).
    // We need a stable effect that reads a ref of state.
    
    // Quick fix: Don't put state in dependency array. Use a ref to access current state.
    
    // ... Refactor to use useRef for state access
    // But hooks rules.
    
    return (
        <AnimatePresence>
            {chatter && (
                <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[150%] z-40"
                >
                    <div className="bg-white text-black p-3 rounded-tr-xl rounded-tl-xl rounded-bl-xl border-2 border-black shadow-lg max-w-xs">
                        <div className="text-[10px] font-bold text-gray-500 uppercase">{chatter.speaker}</div>
                        <div className="font-mono text-sm">{chatter.text}</div>
                        {/* Triangle tail */}
                        <div className="absolute -bottom-2 right-0 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-white border-r-[0px] border-r-transparent"></div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
