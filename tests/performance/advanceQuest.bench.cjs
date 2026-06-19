const { performance } = require('perf_hooks');

const ITERATIONS = 1_000_000;

const state = {
  activeQuests: Array.from({ length: 5 }, (_, i) => ({
    id: `quest-${i}`,
    progress: 0,
    required: 10,
  }))
};

function currentAdvanceQuest(questId) {
    if (!state.activeQuests) return -1;
    // Current code at line 243 BEFORE optimization:
    const questIndex = state.activeQuests.findIndex(q => q?.id === questId);
    if (questIndex === -1) return -1;
    return questIndex;
}

function optimizedAdvanceQuest(questId) {
    if (!state.activeQuests) return -1;
    let questIndex = -1;
    for (let j = 0; j < state.activeQuests.length; j++) {
        if (state.activeQuests[j]?.id === questId) {
            questIndex = j;
            break;
        }
    }
    if (questIndex === -1) return -1;
    return questIndex;
}

function runBenchmark() {
    let start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        currentAdvanceQuest('quest-4');
    }
    let end = performance.now();
    const currentMs = end - start;

    start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        optimizedAdvanceQuest('quest-4');
    }
    end = performance.now();
    const optMs = end - start;

    return { currentMs, optMs };
}

// Warmup
for(let i=0; i<5; i++) runBenchmark();

const results = runBenchmark();
console.log('Current method (Array.findIndex):', results.currentMs.toFixed(2), 'ms');
console.log('Optimized method (for loop):', results.optMs.toFixed(2), 'ms');
console.log(`Improvement: ${((results.currentMs - results.optMs) / results.currentMs * 100).toFixed(2)}%`);
