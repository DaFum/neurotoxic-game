const fs = require('fs');

let content = fs.readFileSync('src/context/reducers/systemReducer.ts', 'utf8');

content = content.replace(/\bisPlainRecord\b/g, 'isLooseRecord');

content = content.replace(
  /const playerData = isLooseRecord\(loadedPlayer\)\s*\n\s*\?\s*\(loadedPlayer as Record<string, unknown>\)\s*\n\s*:\s*\{\}/g,
  'const playerData = isLooseRecord(loadedPlayer) ? Object.assign(Object.create(null), loadedPlayer) : {}'
);

content = content.replace(
  /const vanData = isLooseRecord\(playerData\.van\)\s*\n\s*\?\s*playerData\.van\s*\n\s*:\s*\{\}/g,
  'const vanData = isLooseRecord(playerData.van) ? Object.assign(Object.create(null), playerData.van) : {}'
);

content = content.replace(
  /const statsData = isLooseRecord\(playerData\.stats\)\s*\n\s*\?\s*playerData\.stats\s*\n\s*:\s*\{\}/g,
  'const statsData = isLooseRecord(playerData.stats) ? Object.assign(Object.create(null), playerData.stats) : {}'
);

content = content.replace(
  /const bandData = isLooseRecord\(loadedBand\)\s*\n\s*\?\s*\(loadedBand as Record<string, unknown>\)\s*\n\s*:\s*\{\}/g,
  'const bandData = isLooseRecord(loadedBand) ? Object.assign(Object.create(null), loadedBand) : {}'
);

content = content.replace(
  /\.\.\.\(isLooseRecord\(bandData\.performance\)\s*\n\s*\?\s*\{/g,
  '...((isLooseRecord(bandData.performance) ? Object.assign(Object.create(null), bandData.performance) : null)\n        ? {'
);

let socialStart = content.indexOf('const sanitizeSocial = (value: unknown): SocialState => {');
let optionStart = content.indexOf('const sanitizeActiveEventOption = ');
let socialBlock = content.substring(socialStart, optionStart);

socialBlock = socialBlock.replace(
  /if \(!isLooseRecord\(value\)\) return sanitized\n/g,
  'if (!isLooseRecord(value)) return sanitized\n  const safeValue = Object.assign(Object.create(null), value)\n'
);
socialBlock = socialBlock.replace(/value\[/g, 'safeValue[');
socialBlock = socialBlock.replace(/value\./g, 'safeValue.');

content = content.substring(0, socialStart) + socialBlock + content.substring(optionStart);

fs.writeFileSync('src/context/reducers/systemReducer.ts', content);

let content2 = fs.readFileSync('src/context/reducers/systemReducer.ts', 'utf8');

content2 = content2.replace(
  /const validatedMembers: BandMember\[\] = memberSource\.flatMap\(\s*\(\s*rawMember,\s*i\s*\)\s*=>\s*\{/g,
  'const validatedMembers: BandMember[] = memberSource.flatMap(\n    (rawMember: unknown, i: number) => {'
);

content2 = content2.replace(
  /sanitized\.activeDeals = safeValue\.activeDeals\.flatMap\(deal => \{/g,
  'sanitized.activeDeals = safeValue.activeDeals.flatMap((deal: unknown) => {'
);

content2 = content2.replace(
  /\.\.\.\(\(isLooseRecord\(bandData\.performance\) \? Object\.assign\(Object\.create\(null\), bandData\.performance\) : null\)\s*\n\s*\?\s*\{/g,
  `...(isLooseRecord(bandData.performance) ? (() => {
            const perfData = Object.assign(Object.create(null), bandData.performance);
            return {`
);

content2 = content2.replace(
  /guitarDifficulty: finiteNumberOr\(\s*bandData\.performance\.guitarDifficulty,/g,
  'guitarDifficulty: finiteNumberOr(\n              perfData.guitarDifficulty,'
);
content2 = content2.replace(
  /drumMultiplier: finiteNumberOr\(\s*bandData\.performance\.drumMultiplier,/g,
  'drumMultiplier: finiteNumberOr(\n              perfData.drumMultiplier,'
);
content2 = content2.replace(
  /crowdDecay: finiteNumberOr\(\s*bandData\.performance\.crowdDecay,/g,
  'crowdDecay: finiteNumberOr(\n              perfData.crowdDecay,'
);

content2 = content2.replace(
  /          \}\s*\n\s*: \{\}\)/g,
  `          };
        })() : {})`
);

fs.writeFileSync('src/context/reducers/systemReducer.ts', content2);
