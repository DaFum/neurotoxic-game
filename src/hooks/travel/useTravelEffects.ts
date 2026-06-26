import { useEffect } from 'react'
import { checkSoftlock } from '../../utils/mapUtils'
import {
  getActiveAssetModifiers,
  getTotalDailyObligations,
  calculateChassisGrossSaleValue
} from '../../utils/assetSelectors'
import { finiteNumberOr } from '../../utils/finiteNumber'
import type { GameState } from '../../types'
import { logger } from '../../utils/logger'
import i18n from '../../i18n'
import { GAME_PHASES } from '../../context/gameConstants'
import type {
  TravelRefsBundle,
  TravelStateBundle,
  TravelLogicParams
} from './types'

/**
 * Runs the travel hook's side effects: stranded-player detection and timer
 * cleanup.
 *
 * @remarks
 * While not traveling, watches for a softlock (no connected node is affordable
 * in fuel AND cash — including daily obligations — and no in-place escape such
 * as an unplayed gig, a blood-bank donation, or an affordable refuel exists).
 * On detection it shows a game-over toast and schedules a
 * 3s timeout that saves and switches to the game-over scene; the timeout is
 * cleared if the softlock resolves or travel begins. A second effect clears all
 * outstanding travel timers on unmount.
 *
 * The softlock effect depends on the individual state slices it reads (not the
 * whole `params` object) so it does not re-run — and reset the game-over
 * countdown — on every unrelated render.
 */
export const useTravelEffects = ({
  refs,
  state,
  params
}: {
  refs: TravelRefsBundle
  state: TravelStateBundle
  params: TravelLogicParams
}) => {
  // Destructure params into granular values so the softlock effect depends on
  // the specific state slices it reads instead of the whole `params` object
  // (which changes reference every render). Depending on `params` would re-run
  // this effect — and its cleanup — on every render, repeatedly clearing and
  // rescheduling the game-over timeout so it would never fire.
  const {
    gameMap,
    player,
    band,
    social,
    assets,
    liabilities,
    addToast,
    saveGame,
    changeScene
  } = params

  useEffect(() => {
    if (!gameMap || state.isTraveling || !player.currentNodeId) {
      if (refs.timeoutRef.current) {
        clearTimeout(refs.timeoutRef.current)
        refs.timeoutRef.current = null
      }
      return
    }

    const sellableAssets: { id: string; net: number }[] = []

    if (assets) {
      for (const asset of assets) {
        const gross = calculateChassisGrossSaleValue(asset, player.day)
        if (gross !== null) {
          let rawTotalPrincipalRemaining = 0
          if (liabilities) {
            for (const key in liabilities) {
              if (Object.hasOwn(liabilities, key)) {
                const l = liabilities[key]
                if (l && l.assetId === asset.id) {
                  rawTotalPrincipalRemaining += Math.max(
                    0,
                    finiteNumberOr(l.principalRemaining, 0)
                  )
                }
              }
            }
          }
          if (gross >= rawTotalPrincipalRemaining) {
            const net = gross - rawTotalPrincipalRemaining
            if (net > 0) {
              sellableAssets.push({ id: asset.id, net })
            }
          }
        }
      }
    }

    const postSaleScenarios: {
      assetProceeds: number
      dailyObligations: number
      assetModifiers: import('../../types/assets').AssetModifiers
    }[] = []
    if (sellableAssets.length > 0 && assets) {
      sellableAssets.sort((a, b) => b.net - a.net)
      const numAssets = Math.min(sellableAssets.length, 10)
      const numCombinations = 1 << numAssets
      for (let i = 1; i < numCombinations; i++) {
        const comboAssetIds: string[] = []
        let comboProceeds = 0
        for (let j = 0; j < numAssets; j++) {
          if ((i & (1 << j)) !== 0) {
            const assetToSell = sellableAssets[j]
            if (assetToSell) {
              comboAssetIds.push(assetToSell.id)
              comboProceeds += assetToSell.net
            }
          }
        }

        const retainedAssets: typeof assets = []
        for (let k = 0, len = assets.length; k < len; k++) {
          const a = assets[k]
          if (a && !comboAssetIds.includes(a.id)) {
            retainedAssets.push(a)
          }
        }

        const retainedLiabilities = Object.create(null) as NonNullable<
          typeof liabilities
        >
        if (liabilities) {
          for (const key in liabilities) {
            if (Object.hasOwn(liabilities, key)) {
              const l = liabilities[key]
              if (l && !comboAssetIds.includes(l.assetId)) {
                retainedLiabilities[key] = l
              }
            }
          }
        }

        postSaleScenarios.push({
          assetProceeds: comboProceeds,
          dailyObligations: getTotalDailyObligations({
            player,
            band,
            social,
            assets: retainedAssets,
            liabilities: retainedLiabilities
          } as GameState),
          assetModifiers: getActiveAssetModifiers(retainedAssets)
        })
      }
    }

    // Mirror the travel gate: each neighbor must be affordable in fuel AND
    // cash including the daily obligations that arrival's advanceDay bills.
    // getTotalDailyObligations guards missing assets internally;
    // getActiveAssetModifiers does not, so fall back to an empty array.
    const softlockContext = {
      dailyObligations: getTotalDailyObligations({
        player,
        band,
        social,
        assets,
        liabilities
      } as GameState),
      assetModifiers: getActiveAssetModifiers(assets ?? []),
      postSaleScenarios
    }

    if (checkSoftlock(gameMap, player, band, softlockContext)) {
      if (!refs.timeoutRef.current) {
        logger.error('TravelLogic', 'GAME OVER: Stranded')
        addToast(
          i18n.t('ui:travel.errors.gameOverStranded', {
            defaultValue:
              'GAME OVER: Stranded! Cannot travel and cannot afford fuel.'
          }),
          'error'
        )
        refs.timeoutRef.current = setTimeout(() => {
          saveGame(false)
          changeScene(GAME_PHASES.GAMEOVER)
        }, 3000)
      }
    } else {
      if (refs.timeoutRef.current) {
        clearTimeout(refs.timeoutRef.current)
        refs.timeoutRef.current = null
      }
    }

    return () => {
      if (refs.timeoutRef.current) {
        clearTimeout(refs.timeoutRef.current)
        refs.timeoutRef.current = null
      }
    }
  }, [
    gameMap,
    player,
    band,
    social,
    assets,
    liabilities,
    addToast,
    saveGame,
    changeScene,
    state.isTraveling,
    refs.timeoutRef
  ])

  useEffect(() => {
    return () => {
      if (refs.timeoutRef.current) {
        clearTimeout(refs.timeoutRef.current)
        refs.timeoutRef.current = null
      }
      if (refs.failsafeTimeoutRef.current) {
        clearTimeout(refs.failsafeTimeoutRef.current)
        refs.failsafeTimeoutRef.current = null
      }
      if (refs.pendingTimeoutRef.current) {
        clearTimeout(refs.pendingTimeoutRef.current)
        refs.pendingTimeoutRef.current = null
      }
    }
  }, [refs.timeoutRef, refs.failsafeTimeoutRef, refs.pendingTimeoutRef])
}
