const fs = require('fs');

let content = fs.readFileSync('src/context/reducers/systemReducer.ts', 'utf8');

content = content.replace(
  /const playerData = isLooseRecord\(loadedPlayer\) \? Object\.assign\(\{\}, loadedPlayer\) : \{\}/g,
  'const playerData = isLooseRecord(loadedPlayer) ? Object.assign(Object.create(null), loadedPlayer) : {}'
);

content = content.replace(
  /const vanData = isLooseRecord\(playerData\.van\) \? Object\.assign\(\{\}, playerData\.van\) : \{\}/g,
  'const vanData = isLooseRecord(playerData.van) ? Object.assign(Object.create(null), playerData.van) : {}'
);

content = content.replace(
  /const statsData = isLooseRecord\(playerData\.stats\) \? Object\.assign\(\{\}, playerData\.stats\) : \{\}/g,
  'const statsData = isLooseRecord(playerData.stats) ? Object.assign(Object.create(null), playerData.stats) : {}'
);

content = content.replace(
  /const bandData = isLooseRecord\(loadedBand\) \? Object\.assign\(\{\}, loadedBand\) : \{\}/g,
  'const bandData = isLooseRecord(loadedBand) ? Object.assign(Object.create(null), loadedBand) : {}'
);

content = content.replace(
  /const perfData = Object\.assign\(\{\}, bandData\.performance\);/g,
  'const perfData = Object.assign(Object.create(null), bandData.performance);'
);

content = content.replace(
  /const safeValue = Object\.assign\(\{\}, value\)/g,
  'const safeValue = Object.assign(Object.create(null), value)'
);

fs.writeFileSync('src/context/reducers/systemReducer.ts', content);

let qlContent = fs.readFileSync('src/domain/questLifecycle.ts', 'utf8');

qlContent = qlContent.replace(
  /const penalty = isLooseRecord\(quest\.failurePenalty\) \? Object\.assign\(\{\}, quest\.failurePenalty\) : undefined/g,
  'const penalty = isLooseRecord(quest.failurePenalty) ? Object.assign(Object.create(null), quest.failurePenalty) : undefined'
);

qlContent = qlContent.replace(
  /const socialPenalty = Object\.hasOwn\(penalty, 'social'\) && isLooseRecord\(penalty\.social\) \? Object\.assign\(\{\}, penalty\.social\) : undefined/g,
  'const socialPenalty = Object.hasOwn(penalty, \'social\') && isLooseRecord(penalty.social) ? Object.assign(Object.create(null), penalty.social) : undefined'
);

qlContent = qlContent.replace(
  /const bandPenalty = Object\.hasOwn\(penalty, 'band'\) && isLooseRecord\(penalty\.band\) \? Object\.assign\(\{\}, penalty\.band\) : undefined/g,
  'const bandPenalty = Object.hasOwn(penalty, \'band\') && isLooseRecord(penalty.band) ? Object.assign(Object.create(null), penalty.band) : undefined'
);

fs.writeFileSync('src/domain/questLifecycle.ts', qlContent);


let content2 = fs.readFileSync('src/context/reducers/systemReducer.ts', 'utf8');

content2 = content2.replace(
  /sanitized\.activeDeals = safeValue\.activeDeals\.flatMap\(deal => \{/g,
  'sanitized.activeDeals = safeValue.activeDeals.flatMap((deal: unknown) => {'
);

fs.writeFileSync('src/context/reducers/systemReducer.ts', content2);
