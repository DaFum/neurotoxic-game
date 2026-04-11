const fs = require('fs');
const file = 'src/ui/MerchPressModal.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `const isAffordable = (player?.money || 0) >= (config.cost || 0)
  const disabledReason = !isAffordable ? t('ui:clinic.notEnoughMoney', { defaultValue: 'Not enough money' }) : null`,
  `const isAffordable = (player?.money || 0) >= (config.cost || 0)
  const hasEnoughHarmony = (band?.harmony || 0) >= (config.harmonyCostOnFail || 0)

  let disabledReason = null
  if (!isAffordable) {
    disabledReason = t('ui:merch_press.not_enough_money', { defaultValue: 'Not enough money' })
  } else if (!hasEnoughHarmony) {
    disabledReason = t('ui:merch_press.not_enough_harmony', { defaultValue: 'Not enough harmony' })
  }`
);

fs.writeFileSync(file, content);
