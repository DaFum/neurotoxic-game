const fs = require('fs');
const file = 'src/scenes/Overworld.jsx';
let content = fs.readFileSync(file, 'utf8');

// I will just read lines and splice the content
const lines = content.split('\n');

const menuStart = lines.findIndex(l => l.includes("<div className='absolute bottom-8 right-8 z-50 pointer-events-auto flex flex-col gap-2 items-end'>"));
let menuEnd = -1;
if (menuStart !== -1) {
  let depth = 0;
  for (let i = menuStart; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('<div')) depth++;
    if (line.includes('</div>')) depth--;
    if (depth === 0 && line.includes('</div>')) {
      menuEnd = i;
      break;
    }
  }
}

const menuReplacement = [
  "      <OverworldMenu",
  "        t={t}",
  "        isMenuOpen={isMenuOpen}",
  "        setIsMenuOpen={setIsMenuOpen}",
  "        isTraveling={isTraveling}",
  "        player={player}",
  "        isSaving={isSaving}",
  "        openStash={openStash}",
  "        openQuests={openQuests}",
  "        openPirateRadio={openPirateRadio}",
  "        openHQ={openHQ}",
  "        handleRefuel={handleRefuel}",
  "        handleRepair={handleRepair}",
  "        handleSaveWithDelay={handleSaveWithDelay}",
  "        changeScene={changeScene}",
  "      />"
];

if (menuStart !== -1 && menuEnd !== -1) {
  lines.splice(menuStart, menuEnd - menuStart + 1, ...menuReplacement);
}

fs.writeFileSync(file, lines.join('\n'));
