import fs from 'fs';

let content = fs.readFileSync('src/hooks/useZealotryAction.ts', 'utf-8');

content = content.replace(
  `  const social = useGameSelector(state => state.social)`,
  `  const social = useGameSelector(state => state.social)
  const gameState = useGameSelector(state => state)`
);

content = content.replace(
  `    canRun = validateZealotryAction(social, player, band, descriptor, undefined)`,
  `    canRun = validateZealotryAction(social, player, band, descriptor, gameState)`
);

fs.writeFileSync('src/hooks/useZealotryAction.ts', content);
