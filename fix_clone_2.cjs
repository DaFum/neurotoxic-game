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

fs.writeFileSync('src/context/reducers/systemReducer.ts', content);
