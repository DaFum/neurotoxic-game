/**
 * Calculates the Y position for a note sprite.
 * @param {object} params - Position inputs.
 * @param {number} params.elapsed - Elapsed time since start in ms.
 * @param {number} params.noteTime - Scheduled note time in ms.
 * @param {number} params.targetY - Target hit line Y position.
 * @param {number} params.speed - Note travel speed.
 * @returns {number} Calculated Y position.
 */
export const calculateNoteY = ({ elapsed, noteTime, targetY, speed }) => {
    const timeUntilHit = noteTime - elapsed;
    return targetY - (timeUntilHit / 1000) * speed;
};

/**
 * Calculates a crowd member offset based on combo intensity.
 * @param {object} params - Crowd animation inputs.
 * @param {number} params.baseY - Base Y position.
 * @param {number} params.combo - Current combo count.
 * @param {number} params.timeMs - Current time in ms.
 * @returns {number} Adjusted Y position.
 */
export const calculateCrowdY = ({ baseY, combo, timeMs }) => {
    const intensity = combo > 10 ? 2 : 1;
    return baseY - Math.abs(Math.sin(timeMs / 100 * intensity) * 5);
};

/**
 * Calculates the lane start X position.
 * @param {object} params - Lane layout inputs.
 * @param {number} params.screenWidth - Current screen width.
 * @param {number} params.laneTotalWidth - Total lane width.
 * @returns {number} Lane start X position.
 */
export const calculateLaneStartX = ({ screenWidth, laneTotalWidth }) => (
    (screenWidth - laneTotalWidth) / 2
);

export const RHYTHM_LAYOUT = Object.freeze({
    laneTotalWidth: 360,
    laneWidth: 100,
    laneHeightRatio: 0.4,
    laneStrokeWidth: 2,
    hitLineHeight: 20,
    hitLineOffset: 60,
    hitLineStrokeWidth: 4,
    rhythmOffsetRatio: 0.6
});

/**
 * Builds layout metrics for the rhythm lanes.
 * @param {object} params - Layout inputs.
 * @param {number} params.screenWidth - Current screen width.
 * @param {number} params.screenHeight - Current screen height.
 * @returns {{startX: number, laneWidth: number, laneHeight: number, laneStrokeWidth: number, hitLineY: number, hitLineHeight: number, hitLineStrokeWidth: number, rhythmOffsetY: number, laneTotalWidth: number}} Layout metrics.
 */
export const buildRhythmLayout = ({ screenWidth, screenHeight }) => {
    const laneTotalWidth = RHYTHM_LAYOUT.laneTotalWidth;
    const startX = calculateLaneStartX({ screenWidth, laneTotalWidth });
    const laneHeight = screenHeight * RHYTHM_LAYOUT.laneHeightRatio;
    const hitLineY = laneHeight - RHYTHM_LAYOUT.hitLineOffset;

    return {
        startX,
        laneWidth: RHYTHM_LAYOUT.laneWidth,
        laneHeight,
        laneStrokeWidth: RHYTHM_LAYOUT.laneStrokeWidth,
        hitLineY,
        hitLineHeight: RHYTHM_LAYOUT.hitLineHeight,
        hitLineStrokeWidth: RHYTHM_LAYOUT.hitLineStrokeWidth,
        rhythmOffsetY: screenHeight * RHYTHM_LAYOUT.rhythmOffsetRatio,
        laneTotalWidth
    };
};
