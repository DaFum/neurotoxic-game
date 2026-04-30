export const generateEffectText = (delta, t) => {
  if (!delta) return ''
  const lines = []

  const addStatLine = (value, tKey, defaultValue, unit = '') => {
    if (typeof value === 'number' && value !== 0) {
      lines.push(
        `${t(tKey, { defaultValue })}: ${value > 0 ? '+' : ''}${value}${unit}`
      )
    }
  }

  // Player
  if (delta.player) {
    addStatLine(delta.player.money, 'ui:stats.money', 'Money', '€')
    addStatLine(delta.player.fame, 'ui:stats.fame', 'Fame')
    addStatLine(delta.player.time, 'ui:stats.time', 'Time', 'h')

    if (delta.player.van) {
      addStatLine(delta.player.van.fuel, 'ui:stats.fuel', 'Fuel')
      addStatLine(
        delta.player.van.condition,
        'ui:stats.van_condition',
        'Van Condition'
      )
    }
  }

  // Social
  if (delta.social) {
    addStatLine(
      delta.social.controversyLevel,
      'ui:stats.controversy',
      'Controversy'
    )
    addStatLine(delta.social.viral, 'ui:stats.viral', 'Viral')
    addStatLine(delta.social.loyalty, 'ui:stats.loyalty', 'Loyalty')
  }

  // Score
  addStatLine(delta.score, 'ui:stats.score', 'Score')

  // Band
  if (delta.band) {
    addStatLine(delta.band.harmony, 'ui:stats.harmony', 'Harmony')
    addStatLine(delta.band.luck, 'ui:stats.luck', 'Luck')
    addStatLine(delta.band.skill, 'ui:stats.skill', 'Skill')

    if (delta.band.membersDelta) {
      let totalMoodChange = 0
      let totalStaminaChange = 0

      if (Array.isArray(delta.band.membersDelta)) {
        for (let i = 0; i < delta.band.membersDelta.length; i++) {
          if (typeof delta.band.membersDelta[i]?.moodChange === 'number') {
            totalMoodChange += delta.band.membersDelta[i].moodChange
          } else if (typeof delta.band.membersDelta[i]?.mood === 'number') {
            totalMoodChange += delta.band.membersDelta[i].mood
          }
          if (typeof delta.band.membersDelta[i]?.staminaChange === 'number') {
            totalStaminaChange += delta.band.membersDelta[i].staminaChange
          } else if (typeof delta.band.membersDelta[i]?.stamina === 'number') {
            totalStaminaChange += delta.band.membersDelta[i].stamina
          }
        }
      } else {
        if (typeof delta.band.membersDelta.moodChange === 'number') {
          totalMoodChange = delta.band.membersDelta.moodChange
        } else if (typeof delta.band.membersDelta.mood === 'number') {
          totalMoodChange = delta.band.membersDelta.mood
        }

        if (typeof delta.band.membersDelta.staminaChange === 'number') {
          totalStaminaChange = delta.band.membersDelta.staminaChange
        } else if (typeof delta.band.membersDelta.stamina === 'number') {
          totalStaminaChange = delta.band.membersDelta.stamina
        }
      }

      addStatLine(totalMoodChange, 'ui:stats.mood', 'Mood')
      addStatLine(totalStaminaChange, 'ui:stats.stamina', 'Stamina')
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
        } else if (qty === true) {
          lines.push(`+${t(`items:${key}`, { defaultValue: key })}`)
        } else if (qty === false) {
          lines.push(`-${t(`items:${key}`, { defaultValue: key })}`)
        }
      }
    }
  }

  // Flags and invisible effects
  if (delta.flags) {
    if (delta.flags.addQuest) {
      const quests = Array.isArray(delta.flags.addQuest)
        ? delta.flags.addQuest
        : [delta.flags.addQuest]
      quests.forEach(q => {
        const questLabel =
          typeof q === 'object' && q !== null
            ? (q.title ?? t(q.label, { defaultValue: q.id }))
            : t(q, { defaultValue: q })
        lines.push(
          `${t('ui:event.new_quest', { defaultValue: 'New Quest' })}: ${questLabel}`
        )
      })
    }
    if (delta.flags.queueEvent || delta.flags.addStoryFlag) {
      lines.push(t('ui:event.story_updated', { defaultValue: 'Story Updated' }))
    }
    if (delta.flags.gameOver) {
      lines.push(t('ui:event.game_over_effect', { defaultValue: 'Game Over' }))
    }
  }

  if (lines.length > 0) {
    const label = t('ui:event.effects_label', { defaultValue: 'Effects:' })
    return `${label} ${lines.join(', ')}`
  }
  return ''
}
