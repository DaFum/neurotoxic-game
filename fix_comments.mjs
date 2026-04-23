import fs from 'fs';

let interactions = fs.readFileSync('src/scenes/kabelsalat/hooks/useKabelsalatInteractions.ts', 'utf8');

interactions = interactions.replace(
  /\/\/ Performance: use Object iteration to find and remove connections in one pass[\s\S]*?setSelectedCable\(null\)/,
  `const connectionSocketId = Object.keys(connections).find(key => connections[key] === cableId)

      if (connectionSocketId) {
        setConnections(prev => {
          const { [connectionSocketId]: _, ...rest } = prev
          return rest
        })
        setSelectedCable(null)`
);
fs.writeFileSync('src/scenes/kabelsalat/hooks/useKabelsalatInteractions.ts', interactions);

let shuffle = fs.readFileSync('src/scenes/kabelsalat/hooks/useKabelsalatShuffle.ts', 'utf8');

shuffle = shuffle.replace(/const randomFnRef = useRef\(getSafeRandom\)[\s\S]*?\}, \[\]\)/, 'const randomFn = getSafeRandom');
shuffle = shuffle.replace(/randomFnRef\.current\(\)/, 'randomFn()');
shuffle = shuffle.replace(/import \{ secureRandom, getSafeRandom \} from '\.\.\/\.\.\/\.\.\/utils\/crypto'/, "import { getSafeRandom } from '../../../utils/crypto'");
shuffle = shuffle.replace(/import \{ logger \} from '\.\.\/\.\.\/\.\.\/utils\/logger'\n/, '');
shuffle = shuffle.replace(/import \{ useEffect, useRef, MutableRefObject, Dispatch, SetStateAction, useMemo \} from 'react'/, "import { useEffect, MutableRefObject, Dispatch, SetStateAction, useMemo } from 'react'");

fs.writeFileSync('src/scenes/kabelsalat/hooks/useKabelsalatShuffle.ts', shuffle);
