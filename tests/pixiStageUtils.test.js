import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCrowdY, calculateLaneStartX, calculateNoteY } from '../src/utils/pixiStageUtils.js';

test('calculateNoteY returns target position at hit time', () => {
    const result = calculateNoteY({
        elapsed: 5000,
        noteTime: 5000,
        targetY: 420,
        speed: 500
    });

    assert.equal(result, 420);
});

test('calculateCrowdY offsets by combo intensity', () => {
    const baseY = 100;
    const lowComboY = calculateCrowdY({ baseY, combo: 5, timeMs: 1000 });
    const highComboY = calculateCrowdY({ baseY, combo: 20, timeMs: 1000 });

    assert.notEqual(lowComboY, highComboY);
});

test('calculateLaneStartX centers lanes', () => {
    const startX = calculateLaneStartX({ screenWidth: 1200, laneTotalWidth: 360 });

    assert.equal(startX, 420);
});
