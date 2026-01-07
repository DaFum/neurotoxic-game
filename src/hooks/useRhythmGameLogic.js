import { useRef, useState, useEffect, useCallback } from 'react';
import { useGameState } from '../context/GameState';
import { calculateGigPhysics, getGigModifiers } from '../utils/simulationUtils';
import { audioManager } from '../utils/AudioManager';
import { startMetalGenerator, stopAudio } from '../utils/audioEngine';
import { buildGigStatsSnapshot, updateGigPerformanceStats } from '../utils/gigStats';

/**
 * Provides rhythm game state, actions, and update loop for the gig scene.
 * @returns {{gameStateRef: object, stats: object, actions: object, update: Function}} Rhythm game API.
 */
export const useRhythmGameLogic = () => {
    const { 
        setlist, band, activeEvent, hasUpgrade, setLastGigStats, 
        addToast, gameMap, player, changeScene, gigModifiers
    } = useGameState();

    const NOTE_MISS_WINDOW_MS = 300;

    // React State for UI
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [health, setHealth] = useState(100);
    const [progress, setProgress] = useState(0);
    const [overload, setOverload] = useState(0);
    const [isToxicMode, setIsToxicMode] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const gameOverTimerRef = useRef(null);

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
            const activeModifiers = getGigModifiers(band, gigModifiers);
            const physics = calculateGigPhysics(band, { bpm: 120 });
            const layer = gameMap?.nodes[player.currentNodeId]?.layer || 0;
            const speedMult = 1.0 + (layer * 0.05);

            // Use band-aware modifiers computed by getGigModifiers (already merged with gigModifiers)
            const mergedModifiers = activeModifiers;
            gameStateRef.current.modifiers = mergedModifiers;
            gameStateRef.current.speed = 500 * speedMult * physics.speedModifier;

            // Apply Modifiers
            if (mergedModifiers.drumSpeedMult > 1.0) gameStateRef.current.speed *= mergedModifiers.drumSpeedMult;

            // PreGig Modifiers
            let hitWindowBonus = mergedModifiers.hitWindowBonus || 0;
            if (mergedModifiers.soundcheck) hitWindowBonus += 30; // Soundcheck bonus

            if (mergedModifiers.catering) {
                // Energy boost: easier physics? Or just stamina?
                // Already handled in physics via band stats if we mutated band, but here we can apply direct overrides
                // For now, let's say it counteracts speed drag
                gameStateRef.current.speed = 500 * speedMult; // Reset drag
            }

            gameStateRef.current.lanes[0].hitWindow = physics.hitWindows.guitar + hitWindowBonus;
            gameStateRef.current.lanes[1].hitWindow = physics.hitWindows.drums + hitWindowBonus;
            gameStateRef.current.lanes[2].hitWindow = physics.hitWindows.bass + hitWindowBonus;

            const notes = [];
            let currentTimeOffset = 2000;
            const activeSetlist = setlist.length > 0 ? setlist : [{ id: 'jam', name: 'Jam', bpm: 120, duration: 60, difficulty: 2 }];

            // Only generate notes for the active song (first in list for now, unless we implement full setlist sequencing)
            // The audio engine plays the first song. Notes should match.
            // If the intention is to play ONLY one song per gig scene invocation:
            const songsToPlay = [activeSetlist[0]];

            songsToPlay.forEach(song => {
                const beatInterval = 60000 / song.bpm;
                // Generate notes only within the song duration
                const songDurationMs = song.duration * 1000;
                const totalBeats = Math.floor(songDurationMs / beatInterval);

                // Deterministic Pattern Generator based on difficulty
                const diff = song.difficulty || 2;
                // Pattern length 16 beats. 1 = Note, 0 = Rest.
                // Seed-like behavior using beat index.

                for (let i = 0; i < totalBeats; i += 1) {
                    const noteTime = currentTimeOffset + (i * beatInterval);
                    // Ensure we don't exceed duration buffer
                    if (noteTime < currentTimeOffset + songDurationMs) {

                        // Difficulty Scaling: Higher diff = more density
                        // Simple modulo-based patterns for "musicality"
                        let shouldSpawn = false;
                        const beatInBar = i % 4;

                        if (diff <= 2) {
                            // Easy: Downbeats (1) and sometimes 3
                            shouldSpawn = (beatInBar === 0) || (i % 8 === 4 && Math.random() > 0.2);
                        } else if (diff <= 4) {
                            // Medium: Downbeats + Offbeats
                            shouldSpawn = (beatInBar === 0 || beatInBar === 2) || (Math.random() > 0.6);
                        } else {
                            // Hard: Chaos / Stream
                            shouldSpawn = (Math.random() > 0.3); // 70% density
                        }

                        if (shouldSpawn) {
                            // Lane selection based on beat index to feel rhythmic (not pure random)
                            // e.g. 0 -> Lane 1 (Kick/Bass), 1 -> Lane 0 (Guitar), ...
                            // Deterministic lane map
                            const laneMap = [1, 0, 2, 0];
                            // Add some variation
                            let laneIndex = laneMap[i % 4];
                            if (diff > 3 && Math.random() > 0.7) laneIndex = Math.floor(Math.random() * 3);

                            notes.push({
                                time: noteTime,
                                laneIndex: laneIndex,
                                hit: false,
                                visible: true,
                                songId: song.id
                            });
                        }
                    }
                }
                // Add exact song duration to offset, no extra padding between songs if strictness is required
                // But usually a small gap is nice. The user said "nur die Sekunden dauert wie angegeben".
                // If setlist has multiple songs, the total duration is sum.
                // Let's stick to sum of durations.
                currentTimeOffset += songDurationMs;
            });
            gameStateRef.current.notes = notes;
            // The total duration of the gig is the end of the last song.
            // Adjust start time offset (2000ms lead-in) + sum of durations.
            gameStateRef.current.totalDuration = currentTimeOffset;

            if (activeSetlist[0].id !== 'jam') {
                // audioRef.current = audioManager.playMusic(activeSetlist[0].id);
                // Switch to Metal Generator
                const currentSong = activeSetlist[0];
                startMetalGenerator(currentSong);
            }

            gameStateRef.current.startTime = Date.now();
            gameStateRef.current.running = true;
        } catch (error) {
            console.error('[useRhythmGameLogic] Failed to initialize gig state.', error);
        }
    }, [band, gameMap?.nodes, player.currentNodeId, setlist, gigModifiers]);

    useEffect(() => {
        initializeGigState();

        const audio = audioRef.current;
        return () => {
            stopAudio();
            if (audio) {
                audio.stop();
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
     * @param {number} count - Number of misses to process (default 1)
     * @returns {void}
     */
    const handleMiss = useCallback((count = 1) => {
        if (count <= 0) return;

        setCombo(0);
        gameStateRef.current.combo = 0;
        setOverload(o => {
            const next = Math.max(0, o - (5 * count));
            gameStateRef.current.overload = next;
            const updatedStats = updateGigPerformanceStats(
                { ...gameStateRef.current.stats, misses: gameStateRef.current.stats.misses + count },
                { combo: gameStateRef.current.combo, overload: next }
            );
            gameStateRef.current.stats = updatedStats;
            return next;
        });
        audioManager.playSFX('miss');
        
        const decayPerMiss = hasUpgrade('bass_sansamp') ? 3 : 5;
        setHealth(h => {
            const next = Math.max(0, h - (decayPerMiss * count));
            if (next <= 0 && !gameStateRef.current.isGameOver) {
                setIsGameOver(true);
                gameStateRef.current.isGameOver = true;
                addToast('BAND COLLAPSED', 'error');

                // Schedule exit from Gig if failed (Softlock fix)
                if (!gameOverTimerRef.current) {
                    gameOverTimerRef.current = setTimeout(() => {
                        setLastGigStats(buildGigStatsSnapshot(gameStateRef.current.score, gameStateRef.current.stats, gameStateRef.current.toxicTimeTotal));
                        changeScene('POSTGIG');
                    }, 4000);
                }
            }
            gameStateRef.current.health = next;
            return next;
        });
    }, [addToast, changeScene, hasUpgrade, setLastGigStats]);

    /**
     * Attempts to register a hit for the active lane.
     * @param {number} laneIndex - Index of the lane to check.
     * @returns {boolean} True when the hit registers.
     */
    const handleHit = useCallback((laneIndex) => {
        const state = gameStateRef.current;
        const now = Date.now();
        const elapsed = now - state.startTime;
        const toxicModeActive = state.isToxicMode;
        
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
            
            // Guestlist Effect: +20% score
            if (state.modifiers.guestlist) points *= 1.2;

            let finalScore = points + (combo * 10);
            if (toxicModeActive) finalScore *= 4;

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
                const next = Math.min(100, h + (toxicModeActive ? 4 : 2));
                gameStateRef.current.health = next;
                return next;
            });
            gameStateRef.current.stats.perfectHits++; 

            if (!toxicModeActive) {
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
    }, [activateToxicMode, combo, handleMiss, hasUpgrade]);

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

        let missCount = 0;
        state.notes.forEach(note => {
            if (note.visible && !note.hit) {
                if (elapsed > note.time + NOTE_MISS_WINDOW_MS) {
                    note.visible = false;
                    missCount++;
                }
            }
        });

        if (missCount > 0) {
            handleMiss(missCount);
        }
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
