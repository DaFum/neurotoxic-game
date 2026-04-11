async function benchmark() {
  const { pickRandomSubset } = await import('../src/utils/randomUtils.js');

  console.log('Benchmarking pickRandomSubset fast-paths...');

  const smallArray = Array.from({ length: 100 }, (_, i) => i);
  const largeArray = Array.from({ length: 10000 }, (_, i) => i);

  const iterations = 100000;

  console.time('pick 1 (small array)');
  for (let i = 0; i < iterations; i++) {
    pickRandomSubset(smallArray, 1);
  }
  console.timeEnd('pick 1 (small array)');

  console.time('pick 2 (small array)');
  for (let i = 0; i < iterations; i++) {
    pickRandomSubset(smallArray, 2);
  }
  console.timeEnd('pick 2 (small array)');

  console.time('pick sparse Fisher-Yates (small array, k=5)');
  for (let i = 0; i < iterations; i++) {
    pickRandomSubset(smallArray, 5);
  }
  console.timeEnd('pick sparse Fisher-Yates (small array, k=5)');

  console.time('pick copy+partial (small array, k=50)');
  for (let i = 0; i < iterations; i++) {
    pickRandomSubset(smallArray, 50);
  }
  console.timeEnd('pick copy+partial (small array, k=50)');


  console.time('pick 1 (large array)');
  for (let i = 0; i < iterations; i++) {
    pickRandomSubset(largeArray, 1);
  }
  console.timeEnd('pick 1 (large array)');

  console.time('pick 2 (large array)');
  for (let i = 0; i < iterations; i++) {
    pickRandomSubset(largeArray, 2);
  }
  console.timeEnd('pick 2 (large array)');

  console.time('pick sparse Fisher-Yates (large array, k=5)');
  for (let i = 0; i < iterations; i++) {
    pickRandomSubset(largeArray, 5);
  }
  console.timeEnd('pick sparse Fisher-Yates (large array, k=5)');

  console.time('pick copy+partial (large array, k=5000)');
  for (let i = 0; i < iterations; i++) {
    pickRandomSubset(largeArray, 5000);
  }
  console.timeEnd('pick copy+partial (large array, k=5000)');
}

benchmark();
