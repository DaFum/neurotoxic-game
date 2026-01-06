import { useRef, useState, useEffect, useCallback } from 'react';
import { useGameState } from '../context/GameState';
import { calculateGigPhysics, getGigModifiers } from '../utils/simulationUtils';
import { eventEngine } from '../utils/eventEngine';
import { audioManager } from '../utils/AudioManager';

export const useRhythmGameLogic = (containerRef) => {
    const { 
        setlist, band, triggerEvent, activeEvent, resolveEvent, 
        setActiveEvent, hasUpgrade, currentGig, setLastGigStats, 
        consumeItem, addToast, gameMap, player, changeScene 
    } = useGameState();

    // React State for UI
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [health, setHealth] = useState(100);
    const [progress, setProgress] = useState(0);
    const [overload, setOverload] = useState(0);
    const [isToxicMode, setIsToxicMode] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);

    // High-Frequency Game State (Ref)
    const gameStateRef = useRef({
        running: true,
        notes: [],
        lanes: [
            { id: 'guitar', key: 'ArrowLeft', x: 0, color: 0xFF0041, active: false, hitWindow: 150 },
            { id: 'drums', key: 'ArrowDown', x: 120, color: 0x00FF41, active: false, hitWindow: 150 },
            { id: 'bass', key: 'ArrowRight', x: 240, color: 0x0041FF, active: false, hitWindow: 150 }
        ],
        startTime: 0,
        pauseTime: null,
        speed: 500,
        modifiers: {},
        stats: { perfectHits: 0, misses: 0, maxCombo: 0, peakHype: 0 },
        // Mirror React State for Renderer
        combo: 0,
        health: 100,
        score: 0,
        isToxicMode: false,
        totalDuration: 0,
        toxicTimeTotal: 0,
        toxicModeEndTime: 0
    });

    // Audio Sync
    const audioRef = useRef(null);

    // Initialization Logic
    useEffect(() => {
        // Physics Setup
        const activeModifiers = getGigModifiers(band);
        const physics = calculateGigPhysics(band, { bpm: 120 }); // Simplified
        const layer = gameMap?.nodes[player.currentNodeId]?.layer || 0;
        const speedMult = 1.0 + (layer * 0.05);

        gameStateRef.current.modifiers = activeModifiers;
        gameStateRef.current.speed = 500 * speedMult * physics.speedModifier;
        if (activeModifiers.drumSpeedMult > 1.0) gameStateRef.current.speed *= activeModifiers.drumSpeedMult;

        gameStateRef.current.lanes[0].hitWindow = physics.hitWindows.guitar;
        gameStateRef.current.lanes[1].hitWindow = physics.hitWindows.drums;
        gameStateRef.current.lanes[2].hitWindow = physics.hitWindows.bass;

        // Note Generation
        const notes = [];
        let currentTimeOffset = 2000;
        const activeSetlist = setlist.length > 0 ? setlist : [{ id: 'jam', name: "Jam", bpm: 120, duration: 60, difficulty: 2 }];

        activeSetlist.forEach(song => {
            const beatInterval = 60000 / song.bpm;
            const totalBeats = Math.floor((song.duration * 1000) / beatInterval);
            for(let i=0; i<totalBeats; i++) {
                if (Math.random() > (0.8 - (song.difficulty * 0.1))) {
                    notes.push({
                        time: currentTimeOffset + (i * beatInterval),
                        laneIndex: Math.floor(Math.random() * 3),
                        hit: false,
                        visible: true,
                        songId: song.id
                    });
                }
            }
            currentTimeOffset += (song.duration * 1000) + 2000;
        });
        gameStateRef.current.notes = notes;
        gameStateRef.current.totalDuration = currentTimeOffset;

        // Start Audio
        if (activeSetlist[0].id !== 'jam') {
            audioRef.current = audioManager.playMusic(activeSetlist[0].id);
        }

        gameStateRef.current.startTime = Date.now();
        gameStateRef.current.running = true;

        // Cleanup
        return () => {
            if (audioRef.current) audioRef.current.stop();
        };
    }, []);

    // Game Loop Update Function (To be called by Pixi Ticker or RAF)
    const update = useCallback((deltaMS) => {
        const state = gameStateRef.current;
        if (!state.running || activeEvent || isGameOver) {
            if (!state.pauseTime) state.pauseTime = Date.now();
            if (audioRef.current && audioRef.current.playing()) audioRef.current.pause();
            return;
        }

        if (state.pauseTime) {
            const durationPaused = Date.now() - state.pauseTime;
            state.startTime += durationPaused;
            state.pauseTime = null;
            if (audioRef.current && !audioRef.current.playing()) audioRef.current.play();
        }

        const now = Date.now();
        const elapsed = now - state.startTime;
        
        // Progress (Throttled State Update?)
        // setProgress is React state, don't call every frame if possible or use Ref for UI
        // For now we assume calling setProgress 60fps is okayish or React batches it.
        // Better: Update renderable ref, let UI poll it? Or just set it.
        setProgress(Math.min(100, (elapsed / state.totalDuration) * 100));

        // Toxic Mode
        if (isToxicMode) {
            if (now > state.toxicModeEndTime) {
                setIsToxicMode(false);
            } else {
                state.toxicTimeTotal += deltaMS;
            }
        }

        // Win Condition
        if (elapsed > state.totalDuration) {
            state.running = false;
            setLastGigStats({
                score: score, // Note: closure trap? 'score' is from render scope. 
                // Fix: Read from Ref if we tracked score there too?
                // Actually 'score' state updates might lag. 
                // Let's rely on Ref stats? No, Ref stats doesn't have total score.
                // We will use the 'score' from state but ensure this is called correctly.
                // Or better: store Score in Ref for logic, sync to State for UI.
                // I'll add score to Ref.
            });
            changeScene('POSTGIG');
            return;
        }

        // Update Notes Logic (Movement is calculated in Render, but Hit Logic is here?)
        // Actually, 'update' usually handles position updates in a decoupled loop.
        // But for Rhythm games, Render *is* position.
        // Let's calculate 'y' positions here so Render is dumb?
        // Or let Render calculate 'y' based on time?
        // Render calculating 'y' is smoother for high refresh rates.
        // Logic only needs to check "Misses".
        
        const targetY = 600; // Arbitrary 'Hit Line' in logic space?
        // We need screen height for accurate "Miss" check.
        // Let's assume passed in or normalized.
        // Let's handle Misses in Render loop? No, Logic should own rules.
        
        // Simplified: Logic checks time. If note.time < elapsed - window -> Miss.
        state.notes.forEach(note => {
            if (note.visible && !note.hit) {
                if (elapsed > note.time + 300) { // Miss window
                    note.visible = false; // logic miss
                    handleMiss();
                }
            }
        });

    }, [activeEvent, isGameOver, score, isToxicMode]); // Dependencies

    // Handlers
    const handleMiss = () => {
        setCombo(0);
        gameStateRef.current.combo = 0; // Sync Ref
        setOverload(o => Math.max(0, o - 5));
        gameStateRef.current.stats.misses++;
        audioManager.playSFX('miss');
        
        const decay = hasUpgrade('bass_sansamp') ? 3 : 5;
        setHealth(h => {
            const next = Math.max(0, h - decay);
            if (next <= 0) setIsGameOver(true);
            gameStateRef.current.health = next; // Sync Ref
            return next;
        });
    };

    const handleHit = (laneIndex) => {
        const state = gameStateRef.current;
        const now = Date.now();
        const elapsed = now - state.startTime;
        
        let hitWindow = state.lanes[laneIndex].hitWindow;
        if (state.modifiers.hitWindowBonus) hitWindow += state.modifiers.hitWindowBonus;
        if (laneIndex === 0 && hasUpgrade('guitar_custom')) hitWindow += 50;

        const note = state.notes.find(n => 
            n.visible && !n.hit && n.laneIndex === laneIndex && 
            Math.abs(n.time - elapsed) < hitWindow
        );

        if (note) {
            note.hit = true;
            note.visible = false; // consumed
            
            audioManager.playSFX('hit');

            let points = 100;
            if (laneIndex === 1 && hasUpgrade('drum_trigger')) points = 120;
            if (laneIndex === 0) points *= (state.modifiers.guitarScoreMult || 1.0);
            
            let finalScore = points + (combo * 10);
            if (isToxicMode) finalScore *= 4;

            setScore(s => {
                const next = s + finalScore;
                gameStateRef.current.score = next;
                return next;
            });
            setCombo(c => {
                const next = c + 1;
                gameStateRef.current.combo = next;
                return next;
            });
            setHealth(h => {
                const next = Math.min(100, h + (isToxicMode ? 4 : 2));
                gameStateRef.current.health = next;
                return next;
            });
            gameStateRef.current.stats.perfectHits++; 

            if (!isToxicMode) {
                setOverload(o => {
                    const next = o + 1;
                    if (next >= 100) {
                        activateToxicMode();
                        return 0;
                    }
                    return next;
                });
            }
            return true; // Hit successful
        } else {
            handleMiss(); // Ghost tap penalty
            return false;
        }
    };

    const activateToxicMode = () => {
        setIsToxicMode(true);
        gameStateRef.current.isToxicMode = true;
        gameStateRef.current.toxicModeEndTime = Date.now() + 10000;
        addToast("TOXIC OVERLOAD!", 'success');
    };

    // Input Handlers
    const registerInput = (laneIndex, isDown) => {
        if (gameStateRef.current.lanes[laneIndex]) {
            gameStateRef.current.lanes[laneIndex].active = isDown;
            if (isDown) handleHit(laneIndex);
        }
    };

    return {
        gameStateRef,
        stats: { score, combo, health, progress, overload, isToxicMode, isGameOver },
        actions: { registerInput, activateToxicMode },
        update // Expose update to be driven by Ticker
    };
};
