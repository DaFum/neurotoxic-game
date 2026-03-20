const Benchmark = require('benchmark');

const suite = new Benchmark.Suite;

const loaded = {
  carA: { texture: 'A' },
  carB: { texture: 'B' },
  carC: { texture: 'C' }
};

suite.add('filter Boolean', function() {
  const cars = [loaded.carA, loaded.carB, loaded.carC].filter(Boolean);
})
.add('manual if-checks without push', function() {
  const cars = [];
  if (loaded.carA) cars[cars.length] = loaded.carA;
  if (loaded.carB) cars[cars.length] = loaded.carB;
  if (loaded.carC) cars[cars.length] = loaded.carC;
})
.add('array literal with spread if defined (no filtering)', function() {
  const cars = [];
  if (loaded.carA) cars.push(loaded.carA);
  if (loaded.carB) cars.push(loaded.carB);
  if (loaded.carC) cars.push(loaded.carC);
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})
.run({ 'async': false });
