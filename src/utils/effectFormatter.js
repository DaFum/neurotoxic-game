export const generateEffectText = (delta, t) => {
  if (!delta) return ''
  const lines = []

  // Player
  if (delta.player) {
    if (delta.player.money) {
      lines.push(
        `${t('ui:stats.money', { defaultValue: 'Geld' })}: ${
          delta.player.money > 0 ? '+' : ''
        }${delta.player.money}€`
      )
    }
  }

  // Band
  if (delta.band) {
    if (delta.band.hype) {
      lines.push(
        `${t('ui:stats.hype', { defaultValue: 'Hype' })}: ${
          delta.band.hype > 0 ? '+' : ''
        }${delta.band.hype}`
      )
    }
    if (delta.band.health) {
      lines.push(
        `${t('ui:stats.health', { defaultValue: 'Gesundheit' })}: ${
          delta.band.health > 0 ? '+' : ''
        }${delta.band.health}`
      )
    }
    if (delta.band.mood) {
      lines.push(
        `${t('ui:stats.mood', { defaultValue: 'Stimmung' })}: ${
          delta.band.mood > 0 ? '+' : ''
        }${delta.band.mood}`
      )
    }
    if (delta.band.energy) {
      lines.push(
        `${t('ui:stats.energy', { defaultValue: 'Energie' })}: ${
          delta.band.energy > 0 ? '+' : ''
        }${delta.band.energy}`
      )
    }
    if (delta.band.time) {
      lines.push(
        `${t('ui:stats.time', { defaultValue: 'Zeit' })}: ${
          delta.band.time > 0 ? '+' : ''
        }${delta.band.time}h`
      )
    }
    if (delta.band.controversyLevel) {
      lines.push(
        `${t('ui:stats.controversy', { defaultValue: 'Kontroverse' })}: ${
          delta.band.controversyLevel > 0 ? '+' : ''
        }${delta.band.controversyLevel}`
      )
    }
    if (delta.band.harmony) {
      lines.push(
        `${t('ui:stats.harmony', { defaultValue: 'Harmonie' })}: ${
          delta.band.harmony > 0 ? '+' : ''
        }${delta.band.harmony}`
      )
    }
  }

  // Inventory/Items
  if (delta.band?.inventory) {
    for (const [item, qty] of Object.entries(delta.band.inventory)) {
      if (typeof qty === 'number' && qty !== 0) {
        lines.push(
          `${t(`items:${item}`, { defaultValue: item })}: ${
            qty > 0 ? '+' : ''
          }${qty}`
        )
      }
    }
  }

  return lines.length > 0 ? `Effekte: ${lines.join(', ')}` : ''
}
