import test from 'node:test'
import assert from 'node:assert/strict'
import { TRANSPORT_EVENTS } from '../../src/data/events/transport.ts'

test('TRANSPORT_EVENTS handles NaN and Infinity for paid option conditions', () => {
  const reststopNightCoffee = TRANSPORT_EVENTS.find(
    e => e.id === 'reststop_night_coffee'
  )
  assert.ok(reststopNightCoffee, 'Should find reststop_night_coffee')

  const vanAcHeaterFailure = TRANSPORT_EVENTS.find(
    e => e.id === 'van_ac_heater_failure'
  )
  assert.ok(vanAcHeaterFailure, 'Should find van_ac_heater_failure')

  const reststopTrunkDealer = TRANSPORT_EVENTS.find(
    e => e.id === 'reststop_trunk_dealer'
  )
  assert.ok(reststopTrunkDealer, 'Should find reststop_trunk_dealer')

  // Find the exact condition functions for the paid options
  const coffeePaidOpt = reststopNightCoffee.options.find(
    o => o.label === 'events:reststop_night_coffee.opt1.label'
  )
  const acHeaterPaidOpt = vanAcHeaterFailure.options.find(
    o => o.label === 'events:van_ac_heater_failure.opt2.label'
  )
  const trunkDealerOpt1 = reststopTrunkDealer.options.find(
    o => o.label === 'events:reststop_trunk_dealer.opt1.label'
  )
  const trunkDealerOpt2 = reststopTrunkDealer.options.find(
    o => o.label === 'events:reststop_trunk_dealer.opt2.label'
  )

  const paidConditions = [
    coffeePaidOpt,
    acHeaterPaidOpt,
    trunkDealerOpt1,
    trunkDealerOpt2
  ].map(o => o.condition)

  for (const condition of paidConditions) {
    assert.ok(condition, 'Condition should be defined')

    // Normal case: money is sufficient
    assert.equal(
      condition({ player: { money: 9999 } }),
      true,
      'Should allow when money is sufficient'
    )
    // Normal case: money is insufficient
    assert.equal(
      condition({ player: { money: 0 } }),
      false,
      'Should deny when money is 0'
    )
    // NaN case
    assert.equal(
      condition({ player: { money: NaN } }),
      false,
      'Should deny when money is NaN'
    )
    // Infinity case (we treat Infinity as not finite, so finiteNumberOr returns 0)
    assert.equal(
      condition({ player: { money: Infinity } }),
      false,
      'Should deny when money is Infinity'
    )
    // -Infinity case
    assert.equal(
      condition({ player: { money: -Infinity } }),
      false,
      'Should deny when money is -Infinity'
    )
    // Undefined case
    assert.equal(
      condition({ player: {} }),
      false,
      'Should deny when money is undefined'
    )
  }
})
