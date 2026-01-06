import { useRef, useState, useEffect, useCallback } from 'react';
import { useGameState } from '../context/GameState';
import { calculateGigPhysics, getGigModifiers } from '../utils/simulationUtils';
import { audioManager } from '../utils/AudioManager';
import { buildGigStatsSnapshot, updateGigPerformanceStats } from '../utils/gigStats';

/**
 * Provides rhythm game state, actions, and update loop for the gig scene.
 * @returns {{gameStateRef: object, stats: object, actions: object, update: Function}} Rhythm game API.
 */
export const useRhythmGameLogic = () => {
    const { 
        setlist, band, activeEvent, hasUpgrade, setLastGigStats, 
        addToast, gameMap, player, changeScene 
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
        isGameOver: false,
        overload: 0,
        totalDuration: 0,
        toxicTimeTotal: 0,
        toxicModeEndTime: 0
    });

    const audioRef = useRef(null);
    const hasInitializedRef = useRef(false);

    /**
     * Initializes gig physics and note data once per gig.
     * @returns {void}
     */
    const initializeGigState = useCallback(() => {
        if (hasInitializedRef.current) {
            return;
        }
        hasInitializedRef.current = true;

        try {
            const activeModifiers = getGigModifiers(band);
            const physics = calculateGigPhysics(band, { bpm: 120 });
            const layer = gameMap?.nodes[player.currentNodeId]?.layer || 0;
            const speedMult = 1.0 + (layer * 0.05);

            gameStateRef.current.modifiers = activeModifiers;
            gameStateRef.current.speed = 500 * speedMult * physics.speedModifier;
            if (activeModifiers.drumSpeedMult > 1.0) gameStateRef.current.speed *= activeModifiers.drumSpeedMult;

            gameStateRef.current.lanes[0].hitWindow = physics.hitWindows.guitar;
            gameStateRef.current.lanes[1].hitWindow = physics.hitWindows.drums;
            gameStateRef.current.lanes[2].hitWindow = physics.hitWindows.bass;

            const notes = [];
            let currentTimeOffset = 2000;
            const activeSetlist = setlist.length > 0 ? setlist : [{ id: 'jam', name: 'Jam', bpm: 120, duration: 60, difficulty: 2 }];

            activeSetlist.forEach(song => {
                const beatInterval = 60000 / song.bpm;
                const totalBeats = Math.floor((song.duration * 1000) / beatInterval);
                for (let i = 0; i < totalBeats; i += 1) {
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

            if (activeSetlist[0].id !== 'jam') {
                audioRef.current = audioManager.playMusic(activeSetlist[0].id);
            }

            gameStateRef.current.startTime = Date.now();
            gameStateRef.current.running = true;
        } catch (error) {
            console.error('[useRhythmGameLogic] Failed to initialize gig state.', error);
        }
    }, [band, gameMap?.nodes, player.currentNodeId, setlist]);

    useEffect(() => {
        initializeGigState();

        return () => {
            if (audioRef.current) {
                audioRef.current.stop();
            }
        };
    }, [initializeGigState]);

    /**
     * Triggers toxic mode and schedules its end.
     * @returns {void}
     */
    const activateToxicMode = useCallback(() => {
        setIsToxicMode(true);
        gameStateRef.current.isToxicMode = true;
        gameStateRef.current.toxicModeEndTime = Date.now() + 10000;
        addToast('TOXIC OVERLOAD!', 'success');
    }, [addToast]);

    /**
     * Applies a miss penalty and updates state/refs.
     * @returns {void}
     */
    const handleMiss = useCallback(() => {
        setCombo(0);
        gameStateRef.current.combo = 0;
        setOverload(o => {
            const next = Math.max(0, o - 5);
            gameStateRef.current.overload = next;
            gameStateRef.current.stats = updateGigPerformanceStats(
                gameStateRef.current.stats,
                { combo: gameStateRef.current.combo, overload: next }
            );
            return next;
        });
        gameStateRef.current.stats.misses++;
        audioManager.playSFX('miss');
        
        const decay = hasUpgrade('bass_sansamp') ? 3 : 5;
        setHealth(h => {
            const next = Math.max(0, h - decay);
            if (next <= 0) {
                setIsGameOver(true);
                gameStateRef.current.isGameOver = true;
            }
            gameStateRef.current.health = next;
            return next;
        });
    }, [hasUpgrade]);

    /**
     * Attempts to register a hit for the active lane.
     * @param {number} laneIndex - Index of the lane to check.
     * @returns {boolean} True when the hit registers.
     */
    const handleHit = useCallback((laneIndex) => {
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
                gameStateRef.current.stats = updateGigPerformanceStats(
                    gameStateRef.current.stats,
                    { combo: next, overload: gameStateRef.current.overload }
                );
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
                    const peakCandidate = Math.min(next, 100);
                    gameStateRef.current.stats = updateGigPerformanceStats(
                        gameStateRef.current.stats,
                        { combo: gameStateRef.current.combo, overload: peakCandidate }
                    );
                    if (next >= 100) {
                        activateToxicMode();
                        gameStateRef.current.overload = 0;
                        return 0;
                    }
                    gameStateRef.current.overload = next;
                    return next;
                });
            }
            return true;
        } else {
            handleMiss();
            return false;
        }
    }, [activateToxicMode, combo, handleMiss, hasUpgrade, isToxicMode]);

    /**
     * Advances the gig logic by one frame.
     * @param {number} deltaMS - Milliseconds elapsed since last frame.
     * @returns {void}
     */
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
        setProgress(Math.min(100, (elapsed / state.totalDuration) * 100));

        if (isToxicMode) {
            if (now > state.toxicModeEndTime) {
                setIsToxicMode(false);
                state.isToxicMode = false;
            } else {
                state.toxicTimeTotal += deltaMS;
            }
        }

        if (elapsed > state.totalDuration) {
            state.running = false;
            setLastGigStats(buildGigStatsSnapshot(state.score, state.stats, state.toxicTimeTotal));
            changeScene('POSTGIG');
            return;
        }

        state.notes.forEach(note => {
            if (note.visible && !note.hit) {
                if (elapsed > note.time + 300) {
                    note.visible = false;
                    handleMiss();
                }
            }
        });
    }, [activeEvent, changeScene, handleMiss, isGameOver, isToxicMode, setLastGigStats]);

    // Input Handlers
    /**
     * Registers player input for a lane.
     * @param {number} laneIndex - Lane index.
     * @param {boolean} isDown - Whether the input is pressed.
     * @returns {void}
     */
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
