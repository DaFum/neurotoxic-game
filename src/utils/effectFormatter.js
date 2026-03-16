export const generateEffectText = (delta, t) => {
  if (!delta) return ''
  const lines = []

  // Player
  if (delta.player) {
    if (delta.player.money) {
      lines.push(
        `${t('ui:stats.money', { defaultValue: 'Money' })}: ${
          delta.player.money > 0 ? '+' : ''
        }${delta.player.money}€`
      )
    }
  }

  // Band
  if (delta.band) {
    const bandStats = [
      { key: 'hype', tKey: 'ui:stats.hype', defaultValue: 'Hype', unit: '' },
      {
        key: 'health',
        tKey: 'ui:stats.health',
        defaultValue: 'Health',
        unit: ''
      },
      { key: 'mood', tKey: 'ui:stats.mood', defaultValue: 'Mood', unit: '' },
      {
        key: 'energy',
        tKey: 'ui:stats.energy',
        defaultValue: 'Energy',
        unit: ''
      },
      { key: 'time', tKey: 'ui:stats.time', defaultValue: 'Time', unit: 'h' },
      {
        key: 'controversyLevel',
        tKey: 'ui:stats.controversy',
        defaultValue: 'Controversy',
        unit: ''
      },
      {
        key: 'harmony',
        tKey: 'ui:stats.harmony',
        defaultValue: 'Harmony',
        unit: ''
      }
    ]

    for (const { key, tKey, defaultValue, unit } of bandStats) {
      if (delta.band[key]) {
        lines.push(
          `${t(tKey, { defaultValue })}: ${
            delta.band[key] > 0 ? '+' : ''
          }${delta.band[key]}${unit}`
        )
      }
    }
  }

  // Inventory/Items
  if (delta.band?.inventory) {
    for (const key in delta.band.inventory) {
      if (Object.hasOwn(delta.band.inventory, key)) {
        const qty = delta.band.inventory[key]
        if (typeof qty === 'number' && qty !== 0) {
          lines.push(
            `${t(`items:${key}`, { defaultValue: key })}: ${
              qty > 0 ? '+' : ''
            }${qty}`
          )
        }
      }
    }
  }

  if (lines.length > 0) {
    const label = t('ui:event.effects_label', { defaultValue: 'Effects:' })
    return `${label} ${lines.join(', ')}`
  }
  return ''
}
