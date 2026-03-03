const fs = require('fs');

const deObj = JSON.parse(fs.readFileSync('public/locales/de/ui.json', 'utf8'));
const enObj = JSON.parse(fs.readFileSync('public/locales/en/ui.json', 'utf8'));

console.log("DE 'rewards.fans':", deObj['rewards.fans']);
console.log("EN 'rewards.fans':", enObj['rewards.fans']);

// Count occurrences
const deRaw = fs.readFileSync('public/locales/de/ui.json', 'utf8');
const enRaw = fs.readFileSync('public/locales/en/ui.json', 'utf8');

const countMatches = (str, regex) => (str.match(regex) || []).length;

console.log("DE duplicate count:", countMatches(deRaw, /"rewards\.fans"/g));
console.log("EN duplicate count:", countMatches(enRaw, /"rewards\.fans"/g));
