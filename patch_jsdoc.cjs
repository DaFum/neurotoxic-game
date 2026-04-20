const fs = require('fs');
const file = 'src/context/GameState.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /\/\*\*\n   \* Dispatches a pirate broadcast action\.\n   \* \@param \{object\} payload - The broadcast payload\.\n   \*\/\n  const darkWebLeak/g,
  `/**\n   * Dispatches a dark web leak action.\n   * @param {object} payload - The leak payload.\n   */\n  const darkWebLeak`
);

fs.writeFileSync(file, content);
console.log('Patched JSDoc');
