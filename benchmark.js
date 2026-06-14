const SENSITIVE_KEY_PATTERNS = [
  'token',
  'secret',
  'key',
  'password',
  'ssn',
  'email',
  'auth',
  'authorization',
  'cookie'
];

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function methodA() {
  return SENSITIVE_KEY_PATTERNS.some(Boolean)
  ? new RegExp(
      SENSITIVE_KEY_PATTERNS.reduce((acc, pattern) => {
        if (pattern) {
          const escaped = escapeRegExp(pattern);
          return acc ? acc + '|' + escaped : escaped;
        }
        return acc;
      }, '')
    )
  : null;
}

function methodB() {
  let patternString = '';
  for (let i = 0; i < SENSITIVE_KEY_PATTERNS.length; i++) {
    const pattern = SENSITIVE_KEY_PATTERNS[i];
    if (pattern) {
      const escaped = escapeRegExp(pattern);
      patternString = patternString ? patternString + '|' + escaped : escaped;
    }
  }
  return patternString ? new RegExp(patternString) : null;
}

function methodC() {
  const arr = [];
  for (let i = 0; i < SENSITIVE_KEY_PATTERNS.length; i++) {
    const pattern = SENSITIVE_KEY_PATTERNS[i];
    if (pattern) {
      arr.push(escapeRegExp(pattern));
    }
  }
  return arr.length > 0 ? new RegExp(arr.join('|')) : null;
}

const ITERATIONS = 1_000_000;

console.time('methodA (Original Reduce)');
for (let i = 0; i < ITERATIONS; i++) {
  methodA();
}
console.timeEnd('methodA (Original Reduce)');

console.time('methodB (For Loop String Concat)');
for (let i = 0; i < ITERATIONS; i++) {
  methodB();
}
console.timeEnd('methodB (For Loop String Concat)');

console.time('methodC (For Loop Array Join)');
for (let i = 0; i < ITERATIONS; i++) {
  methodC();
}
console.timeEnd('methodC (For Loop Array Join)');
