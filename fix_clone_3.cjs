const fs = require('fs');
let content = fs.readFileSync('src/context/reducers/systemReducer.ts', 'utf8');

content = content.replace(
  /Object\.assign\(\{\},/g,
  'Object.assign(Object.create(null),'
);

fs.writeFileSync('src/context/reducers/systemReducer.ts', content);
