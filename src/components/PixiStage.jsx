import React, { useEffect, useRef } from 'react';
import { createPixiStageController } from './PixiStageController';

/**
 * Renders the Pixi.js stage for the rhythm game.
 * @param {{ logic: { gameStateRef: object, stats: object, update: Function } }} props - Component props.
 * @returns {JSX.Element} Pixi canvas wrapper.
 */
export const PixiStage = ({ logic }) => {
    const containerRef = useRef(null);
    const { gameStateRef, update } = logic;
    const updateRef = useRef(update);
    const statsRef = useRef(logic.stats);
    const controllerRef = useRef(null);

    useEffect(() => {
        updateRef.current = update;
    }, [update]);

    useEffect(() => {
        statsRef.current = logic.stats;
    }, [logic.stats]);

    useEffect(() => {
        controllerRef.current = createPixiStageController({
            containerRef,
            gameStateRef,
            updateRef,
            statsRef
        });
        controllerRef.current.init();

        return () => {
            if (controllerRef.current) {
                controllerRef.current.dispose();
                controllerRef.current = null;
            }
        };
    }, []);

    return <div className="absolute inset-0 z-20 pointer-events-none" ref={containerRef}></div>;
};
