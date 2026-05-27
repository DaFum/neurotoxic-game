const fs = require('fs');
let content = fs.readFileSync('src/context/reducers/systemReducer.ts', 'utf8');

content = content.replace(
  /const safeValue = Object\.assign\(Object\.create\(null\), value\)\s*\n\s*const safeValue = Object\.assign\(Object\.create\(null\), value\)/g,
  'const safeValue = Object.assign(Object.create(null), value)'
);

fs.writeFileSync('src/context/reducers/systemReducer.ts', content);
