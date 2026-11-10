import { test, describe, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

// Mocks
const mockCalculateTravelExpenses = mock.fn()
const mockCalculateRefuelCost = mock.fn()

// Mock module before import
mock.module(new URL('../../src/utils/economy/index.ts', import.meta.url).href, {
  namedExports: {
    calculateTravelExpenses: mockCalculateTravelExpenses,
    calculateRefuelCost: mockCalculateRefuelCost,
    // The rest-income escape prices living costs; a flat figure keeps the
    // fixtures' daily net equal to their `dailyObligations`.
    calculateGuaranteedDailyCost: () => 80,
    // checkSoftlock reads MAX_FUEL for its refuel escape hatch.
    EXPENSE_CONSTANTS: { transport: { maxFuel: 100 } }
  }
})

// Import module under test
const { GAME_CONSTANTS } = await import('../../src/context/gameConstants.ts')
const {
  isConnected,
  getConnectedTargetIds,
  getNodeVisibility,
  checkSoftlock,
  normalizeVenueId
} = await import('../../src/utils/mapUtils')

describe('mapUtils', () => {
  describe('isConnected', () => {
    const gameMap = {
      connections: [
        { from: 'A', to: 'B' },
        { from: 'B', to: 'C' }
      ]
    }

    test('returns true if nodes are directly connected', () => {
      assert.equal(isConnected(gameMap, 'A', 'B'), true)
    })

    test('returns false if nodes are not directly connected', () => {
      assert.equal(isConnected(gameMap, 'A', 'C'), false)
    })

    test('returns false if map is missing', () => {
      assert.equal(isConnected(null, 'A', 'B'), false)
    })

    test('returns false for reverse connection if map is directed', () => {
      assert.equal(isConnected(gameMap, 'B', 'A'), false)
    })

    test('returns false if source and target are the same but no self-connection exists', () => {
      assert.equal(isConnected(gameMap, 'A', 'A'), false)
    })

    test('returns false if gameMap.connections is empty', () => {
      assert.equal(isConnected({ connections: [] }, 'A', 'B'), false)
    })

    test('returns false if fromNodeId or targetNodeId is missing', () => {
      assert.equal(isConnected(gameMap, null, 'B'), false)
      assert.equal(isConnected(gameMap, 'A', null), false)
      assert.equal(isConnected(gameMap, null, null), false)
    })

    test('returns false if gameMap.connections is missing', () => {
      assert.equal(isConnected({}, 'A', 'B'), false)
    })

    test('skips malformed connections', () => {
      assert.equal(
        isConnected(
          { connections: [null, 7, { from: 'A' }, { from: 'A', to: 'B' }] },
          'A',
          'B'
        ),
        true
      )
    })
  })

  describe('getConnectedTargetIds', () => {
    const gameMap = {
      connections: [
        { from: 'A', to: 'B' },
        { from: 'A', to: 'C' },
        { from: 'B', to: 'D' }
      ]
    }

    test('returns reachable target node IDs for current node', () => {
      const targets = getConnectedTargetIds(gameMap, 'A')
      assert.equal(targets.size, 2)
      assert.equal(targets.has('B'), true)
      assert.equal(targets.has('C'), true)
      assert.equal(targets.has('D'), false)
    })

    test('returns empty set if node has no outgoing connections', () => {
      const targets = getConnectedTargetIds(gameMap, 'D')
      assert.equal(targets.size, 0)
    })

    test('is directed (does not include incoming connections)', () => {
      const targets = getConnectedTargetIds(gameMap, 'B')
      assert.equal(targets.size, 1)
      assert.equal(targets.has('D'), true)
      assert.equal(targets.has('A'), false)
    })

    test('returns empty set if map is missing or invalid', () => {
      assert.equal(getConnectedTargetIds(null, 'A').size, 0)
      assert.equal(getConnectedTargetIds(undefined, 'A').size, 0)
      assert.equal(getConnectedTargetIds({}, 'A').size, 0)
    })

    test('returns empty set if currentNodeId is missing or empty', () => {
      assert.equal(getConnectedTargetIds(gameMap, null).size, 0)
      assert.equal(getConnectedTargetIds(gameMap, undefined).size, 0)
      assert.equal(getConnectedTargetIds(gameMap, '').size, 0)
    })

    test('skips malformed connections', () => {
      const malformedMap = {
        connections: [
          null,
          123,
          { from: 'A' },
          { from: 'A', to: 'B' },
          { from: 'A', to: 456 }
        ]
      }
      const targets = getConnectedTargetIds(malformedMap, 'A')
      assert.equal(targets.size, 1)
      assert.equal(targets.has('B'), true)
    })

    test('supports map with edges array fallback', () => {
      const edgesMap = {
        edges: [{ from: 'X', to: 'Y' }]
      }
      const targets = getConnectedTargetIds(edgesMap, 'X')
      assert.equal(targets.size, 1)
      assert.equal(targets.has('Y'), true)
    })
  })

  describe('getNodeVisibility', () => {
    test('returns visible for current layer', () => {
      assert.equal(getNodeVisibility(1, 1), 'visible')
    })

    test('returns visible for next layer', () => {
      assert.equal(getNodeVisibility(2, 1), 'visible')
    })

    test('returns dimmed for layer + 2', () => {
      assert.equal(getNodeVisibility(3, 1), 'dimmed')
    })

    test('returns hidden for layer + 3 or more', () => {
      assert.equal(getNodeVisibility(4, 1), 'hidden')
    })
  })

  describe('checkSoftlock', () => {
    const gameMap = {
      nodes: {
        A: { id: 'A', type: 'REST' },
        B: { id: 'B', type: 'GIG' }
      },
      connections: [{ from: 'A', to: 'B' }]
    }

    beforeEach(() => {
      mockCalculateTravelExpenses.mock.resetCalls()
      mockCalculateRefuelCost.mock.resetCalls()
    })

    test('returns false if map or player invalid', () => {
      assert.equal(checkSoftlock(null, { currentNodeId: 'A' }), false)
      assert.equal(checkSoftlock(gameMap, {}), false)
    })

    test('returns false if player can reach a neighbor', () => {
      mockCalculateTravelExpenses.mock.mockImplementation(() => ({
        fuelLiters: 10
      }))
      const player = { currentNodeId: 'A', van: { fuel: 20 }, money: 0 }

      assert.equal(checkSoftlock(gameMap, player), false)
    })

    test('returns false if player cannot reach neighbor but can refuel', () => {
      mockCalculateTravelExpenses.mock.mockImplementation(() => ({
        fuelLiters: 30
      }))
      mockCalculateRefuelCost.mock.mockImplementation(() => 50)
      const player = { currentNodeId: 'A', van: { fuel: 20 }, money: 100 }

      assert.equal(checkSoftlock(gameMap, player), false)
    })

    test('returns true if player cannot reach neighbor and cannot refuel', () => {
      mockCalculateTravelExpenses.mock.mockImplementation(() => ({
        fuelLiters: 30
      }))
      mockCalculateRefuelCost.mock.mockImplementation(() => 50)
      const player = { currentNodeId: 'A', van: { fuel: 20 }, money: 40 }

      assert.equal(checkSoftlock(gameMap, player), true)
    })

    test('prices a leg at the effective expedition fuel multiplier', () => {
      mockCalculateTravelExpenses.mock.mockImplementation(() => ({
        fuelLiters: 10
      }))
      mockCalculateRefuelCost.mock.mockImplementation(() => 0)
      const player = { currentNodeId: 'A', van: { fuel: 9 }, money: 0 }

      // A 10 L leg is out of reach on 9 L at the neutral rate, but a 0.85
      // multiplier makes it an 8.5 L leg, matching settlement.
      assert.equal(checkSoftlock(gameMap, player), true)
      assert.equal(
        checkSoftlock(gameMap, player, null, { fuelMultiplier: 0.85 }),
        false
      )
      // A heavier chassis can make a previously reachable leg unreachable.
      const fuller = { ...player, van: { fuel: 11 } }
      assert.equal(checkSoftlock(gameMap, fuller), false)
      assert.equal(
        checkSoftlock(gameMap, fuller, null, { fuelMultiplier: 1.2 }),
        true
      )
    })

    test('treats non-finite fuel as empty when checking reachable neighbors', () => {
      mockCalculateTravelExpenses.mock.mockImplementation(() => ({
        fuelLiters: 30
      }))
      mockCalculateRefuelCost.mock.mockImplementation(() => 50)
      const player = {
        currentNodeId: 'A',
        van: { fuel: Number.POSITIVE_INFINITY },
        money: 40
      }

      assert.equal(checkSoftlock(gameMap, player), true)
    })

    test('returns false if current node is GIG even if stranded otherwise', () => {
      mockCalculateTravelExpenses.mock.mockImplementation(() => ({
        fuelLiters: 30
      }))
      mockCalculateRefuelCost.mock.mockImplementation(() => 50)
      const gigMap = {
        nodes: {
          A: { id: 'A', type: 'GIG' }, // Current is GIG
          B: { id: 'B' }
        },
        connections: [{ from: 'A', to: 'B' }]
      }
      const player = { currentNodeId: 'A', van: { fuel: 20 }, money: 40 }

      assert.equal(checkSoftlock(gigMap, player), false)
    })

    test('does not count a neighbor the booking gate refuses as an escape', () => {
      mockCalculateTravelExpenses.mock.mockImplementation(() => ({
        fuelLiters: 10
      }))
      mockCalculateRefuelCost.mock.mockImplementation(() => 50)
      const player = { currentNodeId: 'A', van: { fuel: 20 }, money: 0 }

      // Affordable in fuel and cash, so reachable without a gate...
      assert.equal(checkSoftlock(gameMap, player), false)
      // ...but stranded once the gate refuses the only neighbor.
      assert.equal(
        checkSoftlock(gameMap, player, null, {
          isNodeAccessible: () => false
        }),
        true
      )
    })

    test('counts an affordable START return as an escape route', () => {
      // The travel gate admits every START node regardless of connectivity,
      // and generated connections only point one layer forward.
      const forwardOnlyMap = {
        nodes: {
          HQ: { id: 'HQ', type: 'START' },
          A: { id: 'A', type: 'REST' },
          B: { id: 'B', type: 'GIG' }
        },
        connections: [
          { from: 'HQ', to: 'A' },
          { from: 'A', to: 'B' }
        ]
      }
      mockCalculateRefuelCost.mock.mockImplementation(() => 50)
      mockCalculateTravelExpenses.mock.mockImplementation(node => ({
        fuelLiters: node.type === 'START' ? 10 : 30,
        totalCost: 0
      }))
      const player = { currentNodeId: 'A', van: { fuel: 20 }, money: 40 }

      assert.equal(checkSoftlock(forwardOnlyMap, player), false)

      // Unaffordable HQ return: still stranded.
      mockCalculateTravelExpenses.mock.mockImplementation(() => ({
        fuelLiters: 30,
        totalCost: 0
      }))
      assert.equal(checkSoftlock(forwardOnlyMap, player), true)
    })

    test('handles missing van object gracefully', () => {
      mockCalculateTravelExpenses.mock.mockImplementation(() => ({
        fuelLiters: 10
      }))
      const player = { currentNodeId: 'A', money: 100 }

      // Should not crash, fuel defaults to 0
      const result = checkSoftlock(gameMap, player)
      assert.ok(typeof result === 'boolean')
    })

    test('treats missing or malformed connections as unreachable without throwing', () => {
      mockCalculateRefuelCost.mock.mockImplementation(() => 50)
      const player = { currentNodeId: 'A', van: { fuel: 20 }, money: 40 }

      assert.equal(checkSoftlock({ nodes: gameMap.nodes }, player), true)
      assert.equal(
        checkSoftlock(
          {
            nodes: gameMap.nodes,
            connections: [null, 7, { from: 'A' }, { from: 'A', to: 123 }]
          },
          player
        ),
        true
      )
    })

    test('passes band state to calculateTravelExpenses', () => {
      mockCalculateTravelExpenses.mock.mockImplementation(() => ({
        fuelLiters: 10
      }))
      const player = { currentNodeId: 'A', van: { fuel: 20 }, money: 100 }
      const band = { members: [] }

      checkSoftlock(gameMap, player, band)

      const calls = mockCalculateTravelExpenses.mock.calls
      assert.ok(calls.length > 0)
      // Fourth argument should be the band
      assert.equal(calls[0].arguments[3], band)
    })

    test('detects money-blocked stranding despite a full tank', () => {
      mockCalculateTravelExpenses.mock.mockImplementation(() => ({
        fuelLiters: 10,
        totalCost: 60
      }))
      mockCalculateRefuelCost.mock.mockImplementation(() => 0)
      const player = { currentNodeId: 'A', van: { fuel: 100 }, money: 50 }

      assert.equal(
        checkSoftlock(gameMap, player, null, { dailyObligations: 80 }),
        true
      )
    })

    test('money-blocked player with travel-affordable cash is not stranded', () => {
      mockCalculateTravelExpenses.mock.mockImplementation(() => ({
        fuelLiters: 10,
        totalCost: 60
      }))
      const player = { currentNodeId: 'A', van: { fuel: 100 }, money: 150 }

      assert.equal(
        checkSoftlock(gameMap, player, null, { dailyObligations: 80 }),
        false
      )
    })

    test('negative daily obligations cannot subsidize the immediate travel cost', () => {
      mockCalculateTravelExpenses.mock.mockImplementation(() => ({
        fuelLiters: 10,
        totalCost: 100
      }))
      mockCalculateRefuelCost.mock.mockImplementation(() => 0)
      const player = { currentNodeId: 'A', van: { fuel: 100 }, money: 75 }

      assert.equal(
        checkSoftlock(gameMap, player, null, { dailyObligations: -50 }),
        true
      )
    })

    test('viable blood-bank donation defuses a stranded verdict', () => {
      mockCalculateTravelExpenses.mock.mockImplementation(() => ({
        fuelLiters: 10,
        totalCost: 60
      }))
      mockCalculateRefuelCost.mock.mockImplementation(() => 0)
      const player = { currentNodeId: 'A', van: { fuel: 100 }, money: 0 }
      const band = {
        harmony: 80,
        members: [{ stamina: 100, staminaMax: 100 }]
      }

      assert.equal(checkSoftlock(gameMap, player, band), false)
    })

    test('consecutive donations (marrow, then blood) defuse a stranded verdict', () => {
      mockCalculateTravelExpenses.mock.mockImplementation(() => ({
        fuelLiters: 10,
        totalCost: 592
      }))
      mockCalculateRefuelCost.mock.mockImplementation(() => 0)
      const player = { currentNodeId: 'A', van: { fuel: 100 }, money: 0 }
      // Marrow alone pays 500 (< 592); marrow leaves harmony 40 and stamina
      // 40, still enough for blood, and the pair pays 600 (>= 592).
      const band = {
        harmony: 80,
        members: [{ stamina: 100, staminaMax: 100 }]
      }

      assert.equal(checkSoftlock(gameMap, player, band), false)
    })

    test('donations combine with asset-sale proceeds', () => {
      mockCalculateTravelExpenses.mock.mockImplementation(() => ({
        fuelLiters: 10,
        totalCost: 550
      }))
      mockCalculateRefuelCost.mock.mockImplementation(() => 0)
      const player = { currentNodeId: 'A', van: { fuel: 100 }, money: 0 }
      // One marrow donation (500) and the sale (100) are each short of 550;
      // together they cover it. Harmony 10 after marrow rules out blood.
      const band = {
        harmony: 50,
        members: [{ stamina: 100, staminaMax: 100 }]
      }

      assert.equal(
        checkSoftlock(gameMap, player, band, {
          postSaleScenarios: [
            { assetProceeds: 100, dailyObligations: 0, assetModifiers: {} }
          ]
        }),
        false
      )
    })

    describe('rest income', () => {
      // No member can donate, so resting is the only cash source in these
      // fixtures. Low harmony and stamina would not do: rests refund both.
      const drainedBand = { harmony: 10, members: [] }
      const restRecovery = { social: {} }

      beforeEach(() => {
        mockCalculateTravelExpenses.mock.mockImplementation(() => ({
          fuelLiters: 10,
          totalCost: 100
        }))
        mockCalculateRefuelCost.mock.mockImplementation(() => 0)
      })

      test('positive daily net earned by resting defuses a stranded verdict', () => {
        const player = {
          currentNodeId: 'A',
          day: 20,
          van: { fuel: 100 },
          money: 50
        }
        // Two rest days at +30 lift 50 to 110, enough for the 100 trip.
        const context = { dailyObligations: -30 }

        assert.equal(checkSoftlock(gameMap, player, drainedBand, context), true)
        assert.equal(
          checkSoftlock(gameMap, player, drainedBand, {
            ...context,
            restRecovery
          }),
          false
        )
      })

      test('a missing social slice does not break the rest look-ahead', () => {
        const player = {
          currentNodeId: 'A',
          day: 20,
          van: { fuel: 100 },
          money: 50
        }
        // Partial or legacy callers can omit the slice; the check must still
        // judge the rest income instead of throwing.
        assert.doesNotThrow(() =>
          checkSoftlock(gameMap, player, drainedBand, {
            dailyObligations: -30,
            restRecovery: {}
          })
        )
      })

      test('rest recovery looks ahead exactly seven rest days', () => {
        const context = { dailyObligations: -7, restRecovery }
        const at = money => ({
          currentNodeId: 'A',
          day: 20,
          van: { fuel: 100 },
          money
        })

        // 51 + 7 * 7 = 100 covers the trip on the seventh rest day.
        assert.equal(
          checkSoftlock(gameMap, at(51), drainedBand, context),
          false
        )
        // 50 would need an eighth day.
        assert.equal(checkSoftlock(gameMap, at(50), drainedBand, context), true)
      })

      test('a day that costs money is never counted as a rescue', () => {
        const player = {
          currentNodeId: 'A',
          day: 20,
          van: { fuel: 100 },
          money: 99
        }

        for (const dailyObligations of [0, 5]) {
          assert.equal(
            checkSoftlock(gameMap, player, drainedBand, {
              dailyObligations,
              restRecovery
            }),
            true
          )
        }
      })

      test('rest income combines with a donation made before resting', () => {
        mockCalculateTravelExpenses.mock.mockImplementation(() => ({
          fuelLiters: 10,
          totalCost: 560
        }))
        const player = {
          currentNodeId: 'A',
          day: 20,
          van: { fuel: 100 },
          money: 0
        }
        // One marrow donation (500, harmony 50 -> 10 rules out blood) plus
        // two rest days at +30 reach 560; neither does alone.
        const band = {
          harmony: 50,
          members: [{ stamina: 100, staminaMax: 100 }]
        }
        const context = { dailyObligations: -30, restRecovery }

        assert.equal(
          checkSoftlock(gameMap, player, band, { dailyObligations: -30 }),
          true
        )
        assert.equal(checkSoftlock(gameMap, player, drainedBand, context), true)
        assert.equal(checkSoftlock(gameMap, player, band, context), false)
      })

      test('selling an asset that turns the daily net positive, then resting, defuses a stranded verdict', () => {
        const player = {
          currentNodeId: 'A',
          day: 20,
          van: { fuel: 100 },
          money: 50
        }
        // The sale raises nothing but sheds the upkeep that made each day cost
        // 5; two rest days at +30 then lift 50 to 110 for the 100 trip.
        const postSaleScenarios = [
          { assetProceeds: 0, dailyObligations: -30, assetModifiers: {} }
        ]
        const context = { dailyObligations: 5, restRecovery }

        assert.equal(checkSoftlock(gameMap, player, drainedBand, context), true)
        assert.equal(
          checkSoftlock(gameMap, player, drainedBand, {
            dailyObligations: 5,
            postSaleScenarios
          }),
          true
        )
        assert.equal(
          checkSoftlock(gameMap, player, drainedBand, {
            ...context,
            postSaleScenarios
          }),
          false
        )
      })

      describe('rest restores the stamina a donation needs', () => {
        // Harmony 80 allows a blood donation; empty stamina rules it out
        // until a rest restores it.
        const tiredBand = {
          harmony: 80,
          members: [{ stamina: 0, staminaMax: 100 }]
        }
        const at = money => ({
          currentNodeId: 'A',
          day: 20,
          van: { fuel: 100 },
          money
        })

        test('a paid rest day followed by a blood donation defuses a stranded verdict', () => {
          // One rest day costs 5 (50 -> 45) and leaves stamina >= 40, enough
          // for blood (+100): 145 covers the 100 trip plus the day's 5.
          const context = { dailyObligations: 5, restRecovery }

          assert.equal(
            checkSoftlock(gameMap, at(50), tiredBand, {
              dailyObligations: 5
            }),
            true
          )
          assert.equal(
            checkSoftlock(gameMap, at(50), tiredBand, context),
            false
          )
        })

        test('a rest day that would leave no cash is not a rescue', () => {
          // 5 - 5 = 0 with obligations still due: the day tick bankrupts, even
          // though a marrow donation after the rest would raise the trip.
          const marrowAfterRest = {
            harmony: 80,
            members: [{ stamina: 30, staminaMax: 100 }]
          }
          assert.equal(
            checkSoftlock(gameMap, at(5), marrowAfterRest, {
              dailyObligations: 5,
              restRecovery
            }),
            true
          )
          assert.equal(
            checkSoftlock(gameMap, at(500), marrowAfterRest, {
              dailyObligations: 5,
              restRecovery
            }),
            false
          )
        })

        test('an empty purse survives the tick while no obligations are due', () => {
          // 0 - 0 = 0 bankrupts only with obligations due
          // (`shouldTriggerBankruptcy`), so the rest-then-blood escape stands.
          assert.equal(
            checkSoftlock(gameMap, at(0), tiredBand, {
              dailyObligations: 0,
              restRecovery
            }),
            false
          )
        })

        test('harmony the tick might take is not subtracted from the rested band', () => {
          // Harmony 30 stays above the blood minimum unless the tick's drains
          // land; the check counts the escape and re-runs on the settled band.
          const band = { ...tiredBand, harmony: 30 }
          assert.equal(
            checkSoftlock(gameMap, at(50), band, {
              dailyObligations: 5,
              restRecovery
            }),
            false
          )
        })

        test('an active contraband effect does not rule the rest donation out', () => {
          const band = {
            ...tiredBand,
            activeContrabandEffects: [
              { effectType: 'harmony', value: 70, remainingDuration: 1 }
            ]
          }
          assert.equal(
            checkSoftlock(gameMap, at(50), band, {
              dailyObligations: 5,
              restRecovery
            }),
            false
          )
        })

        test('errs towards an escape when the tick might cost harmony (#3503)', () => {
          // Just above the blood minimum with a contraband effect about to
          // expire: a false stranded verdict ends the run, a missed one only
          // costs a rest after which the check re-runs on the settled band.
          const band = {
            harmony: 16,
            members: [{ stamina: 0, staminaMax: 100 }],
            activeContrabandEffects: [
              { effectType: 'harmony', value: 10, remainingDuration: 1 }
            ]
          }
          assert.equal(
            checkSoftlock(gameMap, at(50), band, { dailyObligations: 5 }),
            true
          )
          assert.equal(
            checkSoftlock(gameMap, at(50), band, {
              dailyObligations: 5,
              restRecovery
            }),
            false
          )
        })
      })

      describe('donate, rest, donate again (#3517)', () => {
        const { MARROW_BASE_MONEY: marrow, BLOOD_BASE_MONEY: blood } =
          GAME_CONSTANTS.BLOOD_BANK
        // Today's run is marrow then blood: harmony 100 -> 45, stamina
        // 100 -> 10. Resting first restores nothing the run needs.
        const freshBand = {
          harmony: 100,
          members: [{ stamina: 100, staminaMax: 100 }]
        }
        const at = money => ({
          currentNodeId: 'A',
          day: 20,
          van: { fuel: 100 },
          money
        })
        const context = { dailyObligations: 5, restRecovery }
        const tripCosting = totalCost =>
          mockCalculateTravelExpenses.mock.mockImplementation(() => ({
            fuelLiters: 10,
            totalCost
          }))

        test('a donation the rest allows counts on top of the run made before it', () => {
          // Trip 700 plus the arrival day's 5. Today: 50 + 600 = 650. Rest
          // first: 45 + 600. Run, rest (stamina 60), blood: 45 + 700 = 745.
          tripCosting(700)
          assert.equal(marrow + blood, 600)
          assert.equal(
            checkSoftlock(gameMap, at(50), freshBand, { dailyObligations: 5 }),
            true
          )
          assert.equal(
            checkSoftlock(gameMap, at(50), freshBand, context),
            false
          )
        })

        test('a lighter run today leaves room for a second marrow after the rest', () => {
          // Marrow (harmony 60, stamina 40), rest (stamina 90), marrow:
          // 45 + 1000 covers 905, which draining the band today (745) misses.
          tripCosting(900)
          assert.equal(
            checkSoftlock(gameMap, at(50), freshBand, context),
            false
          )
        })

        test('donations made before the rest keep the tick from bankrupting the band', () => {
          // 5 - 5 would be 0 with obligations due, but the marrow donated
          // first leaves 500 after the tick; a second marrow then reaches 1000.
          tripCosting(700)
          assert.equal(checkSoftlock(gameMap, at(5), freshBand, context), false)
        })

        test('the rests refund the harmony a later donation needs', () => {
          // Marrow and blood today (harmony 45, 650), two rests (harmony 50,
          // stamina 95), marrow (harmony 10), two rests (harmony 16), blood:
          // 30 + 1200 covers the 1205 a 1200 trip needs within seven rests.
          tripCosting(1200)
          assert.equal(
            checkSoftlock(gameMap, at(50), freshBand, context),
            false
          )
        })

        test('rests lift harmony back above the blood minimum', () => {
          // Harmony 10 rules out every donation today; two rests regen it to
          // 16, and blood then pays 100: 40 + 100 covers 100 plus the day's 5.
          tripCosting(100)
          const band = {
            harmony: 10,
            members: [{ stamina: 100, staminaMax: 100 }]
          }
          assert.equal(
            checkSoftlock(gameMap, at(50), band, { dailyObligations: 5 }),
            true
          )
          assert.equal(checkSoftlock(gameMap, at(50), band, context), false)
        })

        test("a rest counts the day tick's stamina gain on top of the van rest", () => {
          // Stamina 10 rules out today's donations. One rest: 10 + 50 - 10
          // leaves only blood (101 misses 500); the tick's regen lifts the
          // budget to marrow (1 + 500 covers 300 plus the day's 200). Without
          // it the second tick bankrupts (201 - 400 + 100 <= 0), so the first
          // rest decides.
          tripCosting(300)
          const band = {
            harmony: 50,
            members: [{ stamina: 10, staminaMax: 100 }]
          }
          assert.equal(
            checkSoftlock(gameMap, at(201), band, {
              dailyObligations: 200,
              restRecovery
            }),
            false
          )
        })

        test('a rest counts asset stamina regen', () => {
          // Stamina 7: one rest funds marrow and blood (600) only with the
          // asset's +30; without it marrow alone leaves 1 + 500 short of the
          // 100 trip plus the day's 501, and the second tick bankrupts
          // (502 - 1002 + 500 = 0 with obligations due).
          tripCosting(100)
          const band = {
            harmony: 50,
            members: [{ stamina: 7, staminaMax: 100 }]
          }
          const withAssetRegen = assetModifiers => ({
            dailyObligations: 501,
            restRecovery,
            assetModifiers
          })
          assert.equal(
            checkSoftlock(gameMap, at(502), band, withAssetRegen({})),
            true
          )
          assert.equal(
            checkSoftlock(
              gameMap,
              at(502),
              band,
              withAssetRegen({ staminaRegenBonusPerDay: 30 })
            ),
            false
          )
        })

        test("a rest counts a brand deal's stamina regen", () => {
          // Stamina 35: one rest leaves 88 for marrow and blood's 90 until the
          // deal's +5 a day closes the gap; the rest is as in the asset case.
          tripCosting(100)
          const band = {
            harmony: 50,
            members: [{ stamina: 35, staminaMax: 100 }]
          }
          const withDeals = activeDeals => ({
            dailyObligations: 501,
            restRecovery: { social: { activeDeals } }
          })
          assert.equal(
            checkSoftlock(gameMap, at(502), band, withDeals([])),
            true
          )
          assert.equal(
            checkSoftlock(
              gameMap,
              at(502),
              band,
              withDeals([{ id: 'sustainable_farming_coop' }])
            ),
            false
          )
        })
      })
    })

    test('an unplayed FESTIVAL at the current node counts as an escape', () => {
      mockCalculateTravelExpenses.mock.mockImplementation(() => ({
        fuelLiters: 30,
        totalCost: 60
      }))
      mockCalculateRefuelCost.mock.mockImplementation(() => 50)
      const festivalMap = {
        nodes: {
          A: { id: 'A', type: 'FESTIVAL' },
          B: { id: 'B' }
        },
        connections: [{ from: 'A', to: 'B' }]
      }
      const player = { currentNodeId: 'A', van: { fuel: 20 }, money: 40 }

      assert.equal(checkSoftlock(festivalMap, player), false)
    })

    test('a gig already played at the current node is no escape', () => {
      mockCalculateTravelExpenses.mock.mockImplementation(() => ({
        fuelLiters: 30,
        totalCost: 60
      }))
      mockCalculateRefuelCost.mock.mockImplementation(() => 50)
      const gigMap = {
        nodes: {
          A: { id: 'A', type: 'GIG' },
          B: { id: 'B' }
        },
        connections: [{ from: 'A', to: 'B' }]
      }
      const player = {
        currentNodeId: 'A',
        lastGigNodeId: 'A',
        van: { fuel: 20 },
        money: 40
      }

      assert.equal(checkSoftlock(gigMap, player), true)
    })

    test('the FINALE node is never reported as stranded', () => {
      mockCalculateRefuelCost.mock.mockImplementation(() => 50)
      const finaleMap = {
        nodes: { A: { id: 'A', type: 'FINALE' } },
        connections: []
      }
      const player = {
        currentNodeId: 'A',
        lastGigNodeId: 'A',
        van: { fuel: 0 },
        money: 0
      }

      assert.equal(checkSoftlock(finaleMap, player), false)
    })
  })

  describe('normalizeVenueId', () => {
    test('returns null for null or undefined input', () => {
      assert.equal(normalizeVenueId(null), null)
      assert.equal(normalizeVenueId(undefined), null)
    })

    test('extracts ID from object with id property', () => {
      const venue = { id: 'club_toxic', name: 'Toxic Club' }
      assert.equal(normalizeVenueId(venue), 'club_toxic')
    })

    test('extracts ID from object with name property', () => {
      const venue = { name: 'club_toxic' }
      assert.equal(normalizeVenueId(venue), 'club_toxic')
    })

    test('returns string directly if venue is a string', () => {
      assert.equal(normalizeVenueId('club_toxic'), 'club_toxic')
    })

    test('strips legacy venues: namespace prefix', () => {
      const venue = { id: 'venues:club_toxic.name' }
      assert.equal(normalizeVenueId(venue), 'club_toxic')
    })

    test('strips .name suffix from legacy format', () => {
      const venueId = 'venues:club_toxic.name'
      assert.equal(normalizeVenueId(venueId), 'club_toxic')
    })

    test('handles string without legacy format', () => {
      assert.equal(normalizeVenueId('club_toxic'), 'club_toxic')
    })

    test('handles object with legacy formatted id', () => {
      const venue = { id: 'venues:arena_metal.name', name: 'Metal Arena' }
      assert.equal(normalizeVenueId(venue), 'arena_metal')
    })

    test('prefers id over name when both exist', () => {
      const venue = { id: 'club_a', name: 'club_b' }
      assert.equal(normalizeVenueId(venue), 'club_a')
    })

    test('returns null for non-string, non-object input', () => {
      assert.equal(normalizeVenueId(123), null)
      assert.equal(normalizeVenueId(true), null)
      assert.equal(normalizeVenueId([]), null)
    })

    test('handles empty object', () => {
      assert.equal(normalizeVenueId({}), null)
    })

    test('handles object with non-string id', () => {
      const venue = { id: 123 }
      assert.equal(normalizeVenueId(venue), null)
    })

    test('strips only venues: prefix, not other prefixes', () => {
      const venueId = 'other:club_toxic.name'
      assert.equal(normalizeVenueId(venueId), 'other:club_toxic.name')
    })

    test('handles venues: prefix without .name suffix', () => {
      const venueId = 'venues:club_toxic'
      // venues: prefix is stripped even when no .name suffix is present
      assert.equal(normalizeVenueId(venueId), 'club_toxic')
    })

    test('handles .name suffix without venues: prefix', () => {
      const venueId = 'club_toxic.name'
      // .name suffix is stripped even when no venues: prefix is present
      assert.equal(normalizeVenueId(venueId), 'club_toxic')
    })

    test('handles multiple .name in string', () => {
      const venueId = 'venues:club.name.name'
      assert.equal(normalizeVenueId(venueId), 'club.name')
    })
  })
})
// Test additions for regression coverage
test('negative daily obligations do not subsidize immediate travel cost', () => {
  const localMap = {
    nodes: { A: { id: 'A' }, B: { id: 'B' } },
    connections: [{ from: 'A', to: 'B' }]
  }
  const localPlayer = { currentNodeId: 'A', van: { fuel: 20 }, money: 50 }

  // Mock implementations
  mockCalculateTravelExpenses.mock.mockImplementation(() => ({
    fuelLiters: 10,
    totalCost: 100
  }))

  const result = checkSoftlock(
    localMap,
    localPlayer, // Player has 50 money, travel costs 100
    null,
    { dailyObligations: -100 }
  )

  assert.equal(
    result,
    true,
    'Player remains stranded until cash covers the immediate travel debit'
  )
})

test('post-refuel money changes travel affordability', () => {
  const localMap = {
    nodes: { A: { id: 'A' }, B: { id: 'B' } },
    connections: [{ from: 'A', to: 'B' }]
  }
  const localPlayer = { currentNodeId: 'A', van: { fuel: 20 }, money: 100 }

  // Mock calculateTravelExpenses to return different values depending on the money passed
  mockCalculateTravelExpenses.mock.mockImplementation(
    (n, cNode, playerState) => {
      // Let's pretend cash reserve fee makes the cost higher if player has more money
      if (playerState.money >= 100) {
        return { fuelLiters: 20, totalCost: 50 } // Too expensive
      } else {
        return { fuelLiters: 20, totalCost: 20 } // Affordable after spending money
      }
    }
  )

  mockCalculateRefuelCost.mock.mockImplementation(() => 50) // Refuel costs 50

  const result = checkSoftlock(
    localMap,
    localPlayer, // Player has 100 money. If they refuel, they have 50 left.
    null,
    {}
  )

  assert.equal(
    result,
    false,
    'Player should not be stranded if refuel reduces money and thus reduces travel expenses'
  )
})

test('donation possible but insufficient to unlock travel does not prevent softlock', () => {
  const localMap = {
    nodes: { A: { id: 'A' }, B: { id: 'B' } },
    connections: [{ from: 'A', to: 'B' }]
  }
  const localPlayer = { currentNodeId: 'A', van: { fuel: 20 }, money: 10 }

  mockCalculateTravelExpenses.mock.mockImplementation(() => ({
    fuelLiters: 10,
    totalCost: 500 // Too expensive even with blood bank
  }))

  const mockBand = {
    harmony: 50,
    members: [{ stamina: 50 }]
  }

  const result = checkSoftlock(localMap, localPlayer, mockBand, {})

  assert.equal(
    result,
    true,
    'Player should be stranded if blood bank donation is insufficient to make travel affordable'
  )
})
test('owned asset with positive net sale value enough to travel avoids softlock', () => {
  const localMap = {
    nodes: { A: { id: 'A' }, B: { id: 'B' } },
    connections: [{ from: 'A', to: 'B' }]
  }
  const localPlayer = { currentNodeId: 'A', van: { fuel: 20 }, money: 0 }

  mockCalculateTravelExpenses.mock.mockImplementation(() => ({
    fuelLiters: 10,
    totalCost: 100 // Player needs 100 money to travel
  }))
  mockCalculateRefuelCost.mock.mockImplementation(() => 0)

  const result = checkSoftlock(
    localMap,
    localPlayer,
    null,
    {
      postSaleScenarios: [
        { assetProceeds: 150, dailyObligations: 0, assetModifiers: {} }
      ]
    } // Asset proceeds will cover travel cost
  )

  assert.equal(
    result,
    false,
    'Player should not be stranded if asset sale proceeds can cover travel cost'
  )
})

test('owned asset with positive net sale value enough to refuel and travel avoids softlock', () => {
  const localMap = {
    nodes: { A: { id: 'A' }, B: { id: 'B' } },
    connections: [{ from: 'A', to: 'B' }]
  }
  const localPlayer = { currentNodeId: 'A', van: { fuel: 0 }, money: 0 } // Player has no fuel and no money

  mockCalculateTravelExpenses.mock.mockImplementation(() => {
    return { fuelLiters: 10, totalCost: 100 } // Player needs 100 money and 10 fuel to travel
  })
  mockCalculateRefuelCost.mock.mockImplementation(() => 50) // Refuel costs 50

  const result = checkSoftlock(
    localMap,
    localPlayer,
    null,
    {
      postSaleScenarios: [
        { assetProceeds: 150, dailyObligations: 0, assetModifiers: {} }
      ]
    } // Asset proceeds will cover refuel (50) and travel cost (100)
  )

  assert.equal(
    result,
    false,
    'Player should not be stranded if asset sale proceeds can cover both refuel and travel cost'
  )
})

test('asset with liabilities exceeding gross value remains softlocked', () => {
  const localMap = {
    nodes: { A: { id: 'A' }, B: { id: 'B' } },
    connections: [{ from: 'A', to: 'B' }]
  }
  const localPlayer = { currentNodeId: 'A', van: { fuel: 20 }, money: 0 }

  mockCalculateTravelExpenses.mock.mockImplementation(() => ({
    fuelLiters: 10,
    totalCost: 100 // Player needs 100 money to travel
  }))
  mockCalculateRefuelCost.mock.mockImplementation(() => 0)

  const result = checkSoftlock(
    localMap,
    localPlayer,
    null,
    {
      postSaleScenarios: [
        { assetProceeds: -50, dailyObligations: 0, assetModifiers: {} }
      ]
    } // Net negative proceeds, should not help
  )

  assert.equal(
    result,
    true,
    'Player should be stranded if asset proceeds do not cover travel cost'
  )
})

test('asset sale checks combinations without false softlock', () => {
  const localMap = {
    nodes: { A: { id: 'A' }, B: { id: 'B' } },
    connections: [{ from: 'A', to: 'B' }]
  }
  const localPlayer = { currentNodeId: 'A', van: { fuel: 10 }, money: 0 }

  mockCalculateTravelExpenses.mock.mockImplementation(
    (n, cNode, playerState, band, assetModifiers) => {
      // If the fuel modifier is lost, the fuel cost is 15. If it's kept, fuel cost is 10.
      const fuelCost =
        assetModifiers && assetModifiers.fuelMultiplier === 0.5 ? 10 : 15
      return { fuelLiters: fuelCost, totalCost: 100 }
    }
  )
  mockCalculateRefuelCost.mock.mockImplementation(() => 0)

  const mockPostSaleScenarios = [
    // Scenario 1: sell Asset A only
    {
      assetProceeds: 150,
      dailyObligations: 0,
      assetModifiers: { fuelMultiplier: 0.5 } // Keep Asset B's modifier
    },
    // Scenario 2: sell Asset B only
    {
      assetProceeds: 150,
      dailyObligations: 0,
      assetModifiers: { fuelMultiplier: 1.0 } // Lose modifier
    },
    // Scenario 3: sell Asset A and B
    {
      assetProceeds: 300,
      dailyObligations: 0,
      assetModifiers: { fuelMultiplier: 1.0 } // Lose modifier
    }
  ]

  const result = checkSoftlock(localMap, localPlayer, null, {
    postSaleScenarios: mockPostSaleScenarios
  })

  assert.equal(
    result,
    false,
    'Player is not softlocked because Scenario 1 makes travel possible'
  )
})

test('reserve pricing uses the actual balance when it is below the protected floor', () => {
  const map = {
    nodes: { A: { id: 'A' }, B: { id: 'B' } },
    connections: [{ from: 'A', to: 'B' }]
  }
  const observedBalances = []
  mockCalculateTravelExpenses.mock.mockImplementation((_, __, player) => {
    observedBalances.push(player.money)
    return { fuelLiters: 1, totalCost: 10000 }
  })
  mockCalculateRefuelCost.mock.mockImplementation(() => 0)
  checkSoftlock(
    map,
    { currentNodeId: 'A', money: 100, van: { fuel: 100 } },
    null,
    {
      protectedCash: 2000,
      postSaleScenarios: [
        { assetProceeds: 1000, dailyObligations: 0, assetModifiers: {} }
      ]
    }
  )
  assert.deepEqual(observedBalances, [100, 1100])
})
