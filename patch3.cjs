const fs = require('fs');
const file = 'src/scenes/Overworld.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace Menu section properly
const menuRegex = /<div className='absolute bottom-8 right-8 z-50 pointer-events-auto flex flex-col gap-2 items-end'>\s*<AnimatePresence>.*?<\/div>\s*<\/div>/s;
const menuReplacement = `<OverworldMenu
        t={t}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        isTraveling={isTraveling}
        player={player}
        isSaving={isSaving}
        openStash={openStash}
        openQuests={openQuests}
        openPirateRadio={openPirateRadio}
        openHQ={openHQ}
        handleRefuel={handleRefuel}
        handleRepair={handleRepair}
        handleSaveWithDelay={handleSaveWithDelay}
        changeScene={changeScene}
      />`;

content = content.replace(menuRegex, menuReplacement);

fs.writeFileSync(file, content);
