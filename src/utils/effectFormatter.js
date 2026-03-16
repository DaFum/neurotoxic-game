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
    if (delta.player.fame) {
      lines.push(
        `${t('ui:stats.fame', { defaultValue: 'Fame' })}: ${
          delta.player.fame > 0 ? '+' : ''
        }${delta.player.fame}`
      )
    }
    if (delta.player.time) {
      lines.push(
        `${t('ui:stats.time', { defaultValue: 'Time' })}: ${
          delta.player.time > 0 ? '+' : ''
        }${delta.player.time}h`
      )
    }
  }

  // Social
  if (delta.social) {
    if (delta.social.controversyLevel) {
      lines.push(
        `${t('ui:stats.controversy', { defaultValue: 'Controversy' })}: ${
          delta.social.controversyLevel > 0 ? '+' : ''
        }${delta.social.controversyLevel}`
      )
    }
  }

  // Band
  if (delta.band) {
    if (delta.band.harmony) {
      lines.push(
        `${t('ui:stats.harmony', { defaultValue: 'Harmony' })}: ${
          delta.band.harmony > 0 ? '+' : ''
        }${delta.band.harmony}`
      )
    }

    if (delta.band.membersDelta) {
      let totalMoodChange = 0
      let totalStaminaChange = 0

      if (Array.isArray(delta.band.membersDelta)) {
        for (let i = 0; i < delta.band.membersDelta.length; i++) {
          if (delta.band.membersDelta[i]?.moodChange) {
            totalMoodChange += delta.band.membersDelta[i].moodChange
          }
          if (delta.band.membersDelta[i]?.staminaChange) {
            totalStaminaChange += delta.band.membersDelta[i].staminaChange
          }
        }
      } else {
        if (delta.band.membersDelta.moodChange) {
          totalMoodChange = delta.band.membersDelta.moodChange
        }
        if (delta.band.membersDelta.staminaChange) {
          totalStaminaChange = delta.band.membersDelta.staminaChange
        }
      }

      if (totalMoodChange !== 0) {
        lines.push(
          `${t('ui:stats.mood', { defaultValue: 'Mood' })}: ${
            totalMoodChange > 0 ? '+' : ''
          }${totalMoodChange}`
        )
      }
      if (totalStaminaChange !== 0) {
        lines.push(
          `${t('ui:stats.stamina', { defaultValue: 'Stamina' })}: ${
            totalStaminaChange > 0 ? '+' : ''
          }${totalStaminaChange}`
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
