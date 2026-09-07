const fs = require('fs');
const file = 'src/context/reducers/socialReducer.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const parsedCost = Number\(payload\.cost\)\n  const parsedFameGain = Number\(payload\.fameGain\)\n  const parsedZealotryGain = Number\(payload\.zealotryGain\)\n  const parsedControversyGain = Number\(payload\.controversyGain\)\n  const parsedHarmonyCost = Number\(payload\.harmonyCost\)/,
  `const parsedCost = payload.cost
  const parsedFameGain = payload.fameGain === undefined ? 0 : payload.fameGain
  const parsedZealotryGain = payload.zealotryGain === undefined ? 0 : payload.zealotryGain
  const parsedControversyGain = payload.controversyGain === undefined ? 0 : payload.controversyGain
  const parsedHarmonyCost = payload.harmonyCost`
);

fs.writeFileSync(file, content);
