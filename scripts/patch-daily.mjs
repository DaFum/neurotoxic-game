import fs from 'fs';

let content = fs.readFileSync('src/utils/dailySocialActionUtils.ts', 'utf-8');

content = content.replace(
  `export const validateZealotryAction = (
  social: Partial<SocialState> | null | undefined,
  player: Partial<PlayerState> | null | undefined,
  band: Partial<BandState> | null | undefined,
  descriptor: ZealotryActionDescriptor
): boolean => {
  if (!social || !player || !band) return false`,
  `export const validateZealotryAction = (
  social: Partial<SocialState> | null | undefined,
  player: Partial<PlayerState> | null | undefined,
  band: Partial<BandState> | null | undefined,
  descriptor: ZealotryActionDescriptor,
  gameState?: GameState
): boolean => {
  if (!social || !player || !band) return false
  const availableMoney = gameState ? getExpeditionSpendableCash(gameState) : player.money`
);

content = content.replace(
  `    money: player.money,`,
  `    money: availableMoney,`
);

fs.writeFileSync('src/utils/dailySocialActionUtils.ts', content);
