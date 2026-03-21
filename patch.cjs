const fs = require('fs');

const file = 'src/scenes/Overworld.jsx';
let content = fs.readFileSync(file, 'utf8');

// Add imports
const importsToAdd = `
import { OverworldHeader } from '../components/overworld/OverworldHeader'
import { OverworldMenu } from '../components/overworld/OverworldMenu'
import { TravelingVan } from '../components/overworld/TravelingVan'
import { EventLog } from '../components/overworld/EventLog'
`;

content = content.replace("import { ToggleRadio } from '../components/ToggleRadio'\n", importsToAdd);

// Replace OverworldHeader section
const headerRegex = /<h2 className='absolute top-20.*?\/>\s*<\/div>/s;
content = content.replace(headerRegex, `<OverworldHeader t={t} locationName={locationName} isTraveling={isTraveling} />`);

// Replace Menu section
const menuRegex = /<div className='absolute bottom-8 right-8 z-50 pointer-events-auto flex flex-col gap-2 items-end'>.*?<\/div>\s*<\/div>/s;
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

// Replace TravelingVan
const vanRegex = /\{\/\* Animated Van.*?<\/motion\.div>\s*\)\}/s;
const vanReplacement = `<TravelingVan
          isTraveling={isTraveling}
          currentNode={currentNode}
          travelTarget={travelTarget}
          vanUrl={vanUrl}
          travelCompletedRef={travelCompletedRef}
          onTravelComplete={onTravelComplete}
        />`;

content = content.replace(vanRegex, vanReplacement);

// Replace Event Log
const eventLogRegex = /<div className='absolute bottom-8 left-8 p-4 border border-ash-gray bg-void-black\/90 max-w-sm z-20 pointer-events-none'>.*?<\/div>/s;
const eventLogReplacement = `<EventLog t={t} player={player} locationName={locationName} />`;

content = content.replace(eventLogRegex, eventLogReplacement);

fs.writeFileSync(file, content);
