const fs = require('fs');

let qlContent = fs.readFileSync('src/domain/questLifecycle.ts', 'utf8');

qlContent = qlContent.replace(/\bisPlainRecord\b/g, 'isLooseRecord');

qlContent = qlContent.replace(
  /const penalty = isLooseRecord\(quest\.failurePenalty\)\s*\n\s*\?\s*quest\.failurePenalty\s*\n\s*:\s*undefined/g,
  'const penalty = isLooseRecord(quest.failurePenalty) ? Object.assign(Object.create(null), quest.failurePenalty) : undefined'
);

qlContent = qlContent.replace(
  /const socialPenalty = isLooseRecord\(penalty\.social\)\s*\n\s*\?\s*penalty\.social\s*\n\s*:\s*undefined/g,
  'const socialPenalty = Object.hasOwn(penalty, \'social\') && isLooseRecord(penalty.social) ? Object.assign(Object.create(null), penalty.social) : undefined'
);

qlContent = qlContent.replace(
  /if \(socialPenalty\?\.controversyLevel != null\)/g,
  'if (socialPenalty && Object.hasOwn(socialPenalty, \'controversyLevel\') && socialPenalty.controversyLevel != null)'
);

qlContent = qlContent.replace(
  /const bandPenalty = isLooseRecord\(penalty\.band\)\s*\n\s*\?\s*penalty\.band\s*\n\s*:\s*undefined/g,
  'const bandPenalty = Object.hasOwn(penalty, \'band\') && isLooseRecord(penalty.band) ? Object.assign(Object.create(null), penalty.band) : undefined'
);

qlContent = qlContent.replace(
  /if \(bandPenalty\?\.harmony != null\)/g,
  'if (bandPenalty && Object.hasOwn(bandPenalty, \'harmony\') && bandPenalty.harmony != null)'
);

fs.writeFileSync('src/domain/questLifecycle.ts', qlContent);
