const fs = require('fs');

// 2. Fix ticket price in calculateTicketIncome (gigLogic.ts)
let gigLogic = fs.readFileSync('src/utils/economy/gigLogic.ts', 'utf8');
gigLogic = gigLogic.replace(
  /const ticketPrice = typeof gigData\.price === 'number' \? gigData\.price : 0\n  if \(\!context\.discountedTickets && ticketPrice > 15\) \{/g,
  `const rawTicketPrice = typeof gigData.price === 'number' ? gigData.price : 0\n  const ticketPrice = context.discountedTickets && rawTicketPrice > 10 ? Math.floor(rawTicketPrice * 0.5) : rawTicketPrice\n  if (!context.discountedTickets && ticketPrice > 15) {`
);
gigLogic = gigLogic.replace(
  /const ticketPrice = typeof gigData\.price === 'number' \? gigData\.price : 0/g,
  `const rawTicketPrice = typeof gigData.price === 'number' ? gigData.price : 0\n  const ticketPrice = context.discountedTickets && rawTicketPrice > 10 ? Math.floor(rawTicketPrice * 0.5) : rawTicketPrice`
);

// 3. Honor gigData.difficulty in calculateVenueSplit
gigLogic = gigLogic.replace(
  /const splitRate =\n    \(gigData\.diff \?\? 0\) >= 5\n      \? 0\.7\n      : Object\.hasOwn\(VENUE_SPLIT_RATES, gigData\.diff \?\? 0\)\n        \? \(VENUE_SPLIT_RATES\[gigData\.diff as number\] \?\? 0\)\n        : 0/,
  `const diff = gigData.diff ?? gigData.difficulty ?? 0\n  const splitRate = diff >= 5\n    ? 0.7\n    : Object.hasOwn(VENUE_SPLIT_RATES, diff)\n      ? (VENUE_SPLIT_RATES[diff] ?? 0)\n      : 0`
);
fs.writeFileSync('src/utils/economy/gigLogic.ts', gigLogic);


// 4. Include fuelCost in totalCost in calculateTravelExpenses (logisticsLogic.ts)
let logisticsLogic = fs.readFileSync('src/utils/economy/logisticsLogic.ts', 'utf8');
logisticsLogic = logisticsLogic.replace(
  /const logisticsCost =\n    TRAVEL_LOGISTICS_BASE \+ distanceLogistics \+ fameLogistics \+ cashReserveFee\n  const totalCost = foodCost \+ logisticsCost/g,
  `const logisticsCost =\n    TRAVEL_LOGISTICS_BASE + distanceLogistics + fameLogistics + cashReserveFee + fuelCost\n  const totalCost = foodCost + logisticsCost`
);
fs.writeFileSync('src/utils/economy/logisticsLogic.ts', logisticsLogic);


// 5. Fix shouldTriggerBankruptcy to take total obligations
logisticsLogic = fs.readFileSync('src/utils/economy/logisticsLogic.ts', 'utf8');
logisticsLogic = logisticsLogic.replace(
  /export const shouldTriggerBankruptcy = \(\n  newMoney: unknown,\n  netIncome: number \| null \| undefined\n\) => \{/,
  `export const shouldTriggerBankruptcy = (\n  newMoney: unknown,\n  netIncome: number | null | undefined,\n  totalDailyObligations: number = 0\n) => {`
);
logisticsLogic = logisticsLogic.replace(
  /const income = netIncome \?\? 0\n\n  \/\/ Bankrupt if at 0 money and net income was strictly negative\.\n  return income < 0/,
  `const income = netIncome ?? 0\n  \n  // Check if we are bleeding money taking into account daily obligations\n  return (income - totalDailyObligations) < 0`
);
fs.writeFileSync('src/utils/economy/logisticsLogic.ts', logisticsLogic);


// 6. Sanitize damageTaken and equipmentDamage before arithmetic (minigameLogic.ts)
let minigameLogic = fs.readFileSync('src/utils/economy/minigameLogic.ts', 'utf8');
minigameLogic = minigameLogic.replace(
  /const conditionLoss = Math\.floor\(Math\.max\(0, damageTaken\) \/ 2\)/,
  `const safeDamageTaken = Number.isFinite(Number(damageTaken)) ? Number(damageTaken) : 0\n  const conditionLoss = Math.floor(Math.max(0, safeDamageTaken) / 2)`
);
minigameLogic = minigameLogic.replace(
  /export const calculateRoadieMinigameResult = \(\n  equipmentDamage: number,\n  bandState: Pick<BandState, 'members'> \| null \| undefined,\n  contrabandDelivered: number = 0\n\) => \{\n  const safeDamage = Math\.max\(0, equipmentDamage\)/,
  `export const calculateRoadieMinigameResult = (\n  equipmentDamage: unknown,\n  bandState: Pick<BandState, 'members'> | null | undefined,\n  contrabandDelivered: number = 0\n) => {\n  const safeEquipmentDamage = Number.isFinite(Number(equipmentDamage)) ? Number(equipmentDamage) : 0\n  const safeDamage = Math.max(0, safeEquipmentDamage)`
);
minigameLogic = minigameLogic.replace(
  /export const calculateTravelMinigameResult = \(\n  damageTaken: number,/,
  `export const calculateTravelMinigameResult = (\n  damageTaken: unknown,`
);
fs.writeFileSync('src/utils/economy/minigameLogic.ts', minigameLogic);
