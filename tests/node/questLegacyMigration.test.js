import test from 'node:test'
import assert from 'node:assert/strict'
import { migrateLegacyQuestSchema } from '../../src/domain/questLegacyMigration.ts'
import { getQuestRewards } from '../../src/domain/questRewards.ts'
import { getQuestPenalties } from '../../src/domain/questPenalties.ts'

test('migrateLegacyQuestSchema - rewards', async t => {
  await t.test('converts moneyReward into a money reward', () => {
    const migrated = migrateLegacyQuestSchema({
      id: 'q',
      moneyReward: 500
    })

    assert.deepEqual(migrated.rewards, [{ type: 'money', amount: 500 }])
    assert.equal(Object.hasOwn(migrated, 'moneyReward'), false)
  })

  await t.test('drops a non-finite moneyReward instead of migrating it', () => {
    const migrated = migrateLegacyQuestSchema({
      id: 'q',
      moneyReward: Number.NaN
    })

    assert.equal(migrated.rewards, undefined)
    assert.equal(Object.hasOwn(migrated, 'moneyReward'), false)
  })

  await t.test('clamps a hostile negative moneyReward to zero', () => {
    // Parity with the clampNonNegative that createAddQuestAction used to
    // apply in place before this conversion moved into the migration.
    const migrated = migrateLegacyQuestSchema({ id: 'q', moneyReward: -900 })

    assert.deepEqual(migrated.rewards, [{ type: 'money', amount: 0 }])
  })

  await t.test('clamps negative fame and harmony reward data', () => {
    assert.deepEqual(
      migrateLegacyQuestSchema({
        id: 'q',
        rewardType: 'fame',
        rewardData: { fame: -50 }
      }).rewards,
      [{ type: 'fame', amount: 0 }]
    )
    assert.deepEqual(
      migrateLegacyQuestSchema({
        id: 'q',
        rewardType: 'harmony',
        rewardData: { harmony: -50 }
      }).rewards,
      [{ type: 'band.harmony', amount: 0 }]
    )
  })

  await t.test('keeps controversy_reduction negative', () => {
    // The one legacy reward whose amount is negative by definition, so it
    // must stay exempt from the non-negative clamp.
    const migrated = migrateLegacyQuestSchema({
      id: 'q',
      rewardType: 'controversy_reduction',
      rewardData: { controversy: 15 }
    })

    assert.deepEqual(migrated.rewards, [
      { type: 'social.controversy', amount: -15 }
    ])
  })

  await t.test('maps each remaining legacy rewardType', () => {
    const cases = [
      [
        { rewardType: 'item', rewardData: { item: 'lucky_pick' } },
        [{ type: 'item.add', itemId: 'lucky_pick' }]
      ],
      [
        { rewardType: 'skill_point', rewardData: { memberIndex: 1 } },
        [{ type: 'skill_point', memberIndex: 1 }]
      ],
      [
        { rewardType: 'fans', rewardData: { fans: 40 } },
        [{ type: 'social.followers', platform: 'instagram', amount: 40 }]
      ],
      [
        { rewardType: 'loyalty', rewardData: { loyalty: 7 } },
        [{ type: 'social.loyalty', amount: 7 }]
      ]
    ]

    for (const [legacy, expected] of cases) {
      assert.deepEqual(
        migrateLegacyQuestSchema({ id: 'q', ...legacy }).rewards,
        expected,
        `rewardType ${legacy.rewardType}`
      )
    }
  })

  await t.test('rejects non-numeric legacy amounts instead of coercing', () => {
    // Regression: Number('1000000') granted a million fame from a string
    // payload that the old action-creator guard had floored to 0.
    assert.deepEqual(
      migrateLegacyQuestSchema({
        id: 'q',
        rewardType: 'fame',
        rewardData: { fame: '1000000' }
      }).rewards,
      undefined
    )

    for (const [rewardType, key] of [
      ['harmony', 'harmony'],
      ['fans', 'fans'],
      ['loyalty', 'loyalty'],
      ['controversy_reduction', 'controversy']
    ]) {
      assert.equal(
        migrateLegacyQuestSchema({
          id: 'q',
          rewardType,
          rewardData: { [key]: '999' }
        }).rewards,
        undefined,
        rewardType
      )
    }
  })

  await t.test('does not throw on a null-prototype legacy amount', () => {
    // Number(Object.create(null)) throws: it has no toString. isQuestStateLike
    // only checks that rewardData is a record, so this payload is reachable
    // and must not abort the dispatch.
    const hostile = Object.create(null)

    assert.doesNotThrow(() =>
      migrateLegacyQuestSchema({
        id: 'q',
        rewardType: 'fame',
        rewardData: { fame: hostile }
      })
    )
    assert.doesNotThrow(() =>
      migrateLegacyQuestSchema({
        id: 'q',
        rewardType: 'item',
        rewardData: { item: hostile }
      })
    )
  })

  await t.test('a populated rewards array wins over legacy fields', () => {
    const migrated = migrateLegacyQuestSchema({
      id: 'q',
      rewards: [{ type: 'fame', amount: 10 }],
      moneyReward: 500
    })

    assert.deepEqual(migrated.rewards, [{ type: 'fame', amount: 10 }])
    assert.equal(Object.hasOwn(migrated, 'moneyReward'), false)
  })
})

test('migrateLegacyQuestSchema - penalties', async t => {
  await t.test('converts the nested failurePenalty record', () => {
    const migrated = migrateLegacyQuestSchema({
      id: 'q',
      failurePenalty: {
        social: { controversyLevel: 20, loyalty: -5 },
        band: { harmony: -10 },
        flags: ['burned_bridge'],
        cooldowns: [{ days: 3, id: 'ignored' }]
      }
    })

    assert.deepEqual(migrated.failurePenalties, [
      { type: 'social.controversy', amount: 20 },
      { type: 'social.loyalty', amount: -5 },
      { type: 'band.harmony', amount: -10 },
      { type: 'flag.add', flag: 'burned_bridge' },
      { type: 'quest.cooldown', days: 3 }
    ])
    assert.equal(Object.hasOwn(migrated, 'failurePenalty'), false)
  })

  await t.test('a populated failurePenalties array wins', () => {
    const migrated = migrateLegacyQuestSchema({
      id: 'q',
      failurePenalties: [{ type: 'band.harmony', amount: -1 }],
      failurePenalty: { band: { harmony: -99 } }
    })

    assert.deepEqual(migrated.failurePenalties, [
      { type: 'band.harmony', amount: -1 }
    ])
  })

  await t.test('does not inherit a prototype-polluting legacy record', () => {
    const hostile = JSON.parse(
      '{"__proto__":{"polluted":true},"band":{"harmony":-5}}'
    )
    const migrated = migrateLegacyQuestSchema({
      id: 'q',
      failurePenalty: hostile
    })

    assert.deepEqual(migrated.failurePenalties, [
      { type: 'band.harmony', amount: -5 }
    ])
    // Inherited, not own: Object.hasOwn({}, 'polluted') is vacuously false
    // whether or not Object.prototype was polluted, so it verified nothing.
    // Real pollution surfaces as an inherited read on a fresh object.
    assert.equal({}.polluted, undefined)
    assert.equal(Object.hasOwn(migrated, '__proto__'), false)
  })
})

test('migrateLegacyQuestSchema - progress rules', async t => {
  await t.test('folds the singular progressRule into progressRules', () => {
    const rule = { event: 'gig.completed', amount: 'fixed', fixedAmount: 1 }
    const migrated = migrateLegacyQuestSchema({ id: 'q', progressRule: rule })

    assert.deepEqual(migrated.progressRules, [rule])
    assert.equal(Object.hasOwn(migrated, 'progressRule'), false)
  })

  await t.test('synthesizes a rule from a bare progressSource', () => {
    const migrated = migrateLegacyQuestSchema({
      id: 'q',
      progressSource: 'gig_completed'
    })

    assert.deepEqual(migrated.progressRules, [
      {
        event: 'gig_completed',
        amount: 'fixed',
        fixedAmount: 1,
        thresholdField: undefined
      }
    ])
  })

  await t.test('carries the implicit amount mode per source', () => {
    for (const source of ['followers_gained', 'fame_gained', 'money_earned']) {
      assert.equal(
        migrateLegacyQuestSchema({ id: 'q', progressSource: source })
          .progressRules[0].amount,
        'event.amount',
        source
      )
    }

    const harmony = migrateLegacyQuestSchema({
      id: 'q',
      progressSource: 'harmony_recovered'
    }).progressRules[0]
    assert.equal(harmony.amount, 'threshold')
    assert.equal(harmony.thresholdField, 'band.harmony')
  })

  await t.test('keeps progressSource: it is also a display tag', () => {
    // QuestsModal, questHintViewModel and continueHandlerUtils read
    // progressSource independently of progress rules, so consuming it here
    // must not remove it.
    const migrated = migrateLegacyQuestSchema({
      id: 'q',
      progressSource: 'gig_completed'
    })

    assert.equal(migrated.progressSource, 'gig_completed')
  })

  await t.test('an EMPTY progressRules array does not win', () => {
    // Regression: treating [] as canonical skipped synthesis and then deleted
    // progressRule anyway, admitting a quest no event could ever advance.
    // Matches the populated-array precedence rewards and penalties use.
    const fromSource = migrateLegacyQuestSchema({
      id: 'q',
      progressRules: [],
      progressSource: 'gig_completed'
    })
    assert.equal(fromSource.progressRules.length, 1)
    assert.equal(fromSource.progressRules[0].event, 'gig_completed')

    const rule = { event: 'gig.completed', amount: 'fixed', fixedAmount: 1 }
    const fromRule = migrateLegacyQuestSchema({
      id: 'q',
      progressRules: [],
      progressRule: rule
    })
    assert.deepEqual(fromRule.progressRules, [rule])
  })

  await t.test('a declared progressRules array wins', () => {
    const rules = [{ event: 'fame.gained', amount: 'event.amount' }]
    const migrated = migrateLegacyQuestSchema({
      id: 'q',
      progressRules: rules,
      progressSource: 'gig_completed',
      progressRule: { event: 'gig.completed', amount: 'fixed' }
    })

    assert.deepEqual(migrated.progressRules, rules)
    assert.equal(Object.hasOwn(migrated, 'progressRule'), false)
  })
})

test('migrateLegacyQuestSchema - identity and hand-off', async t => {
  await t.test('returns a canonical quest unchanged by reference', () => {
    const quest = {
      id: 'q',
      rewards: [{ type: 'money', amount: 5 }],
      failurePenalties: [{ type: 'band.harmony', amount: -1 }]
    }

    assert.equal(migrateLegacyQuestSchema(quest), quest)
  })

  await t.test('migrated output is readable by the domain getters', () => {
    const migrated = migrateLegacyQuestSchema({
      id: 'q',
      moneyReward: 250,
      failurePenalty: { social: { controversyLevel: 12 } }
    })

    assert.deepEqual(getQuestRewards(migrated), [
      { type: 'money', amount: 250 }
    ])
    assert.deepEqual(getQuestPenalties(migrated), [
      { type: 'social.controversy', amount: 12 }
    ])
  })
})
