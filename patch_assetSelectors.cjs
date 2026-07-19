const fs = require('fs');
fs.writeFileSync('src/utils/assetSelectors.ts', "export * from './assetSelectors/index'\n");
