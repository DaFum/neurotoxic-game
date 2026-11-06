import type { TFunction } from 'i18next'
import {
  useCallback,
  useMemo,
  startTransition,
  type MutableRefObject,
  type Dispatch
} from 'react'
import type {
  GameState,
  GameAction,
  SocialState,
  GamePhase,
  LoadGameResult,
  LoadPreviewResult
} from '../types'
import { GAME_PHASES, PRACTICE_RETURN_SCENES } from './gameConstants'
import {
} from '../utils/storage'
import { handleError, StateError } from '../utils/errorHandler'
import { addUnlockWithPersistence, getUnlocks } from '../utils/unlockManager'
import { useStorage } from './StorageContext'
import { usePersistence } from './usePersistence'
import { useEventSystem } from './useEventSystem'
import { useMinigameDispatchActions } from './useMinigameDispatchActions'
import { useAssetDispatchActions } from './assets/useAssetDispatchActions'
import { useExpeditionDispatchActions } from './useExpeditionDispatchActions'
import { gameReducer } from './gameReducer'
import { useCareerDispatchActions } from './useCareerDispatchActions'
import {
  createBeginExpeditionUnlockPurchaseAction,
  createCommitExpeditionLegendaryRewardAction,
  createCompleteExpeditionUnlockPurchaseAction,
  createPurchaseExpeditionHqFacilityAction,
  createRollbackExpeditionUnlockPurchaseAction
} from './careerActionCreators'
import {
  getExpeditionHqFacilityLevel,
  getExpeditionHqFacilityPurchaseBlocker,
  getExpeditionUnlockSetPurchaseBlocker,
  type ExpeditionCareerPurchaseBlocker
} from '../domain/expedition/meta'
import type { ExpeditionLegendaryClaim } from '../types/expedition'
import { getExpeditionLegendaryMarkerId } from '../data/expedition/legendaries'
import { resolveExpeditionLegendaryCandidate } from '../domain/expedition/legendaries'
import {
  useFacilityDispatchActions,
  type FacilityDispatchActions
} from './useFacilityDispatchActions'
import {
  useQuestDispatchActions,
  type QuestDispatchActions
} from './useQuestDispatchActions'
import {
  useRivalBandDispatchActions,
  type RivalBandDispatchActions
} from './useRivalBandDispatchActions'
import { useSimpleDispatchActions } from './useSimpleDispatchActions'
import {
  createChangeSceneAction,
  createUpdatePlayerAction,
  createUpdateBandAction,
  createRecordPendingGigSettlementAction,
  createApplySocialPostResultAction,
  createUpdateSettingsAction,
  createSetMapAction,
  createSetGigAction,
  createStartGigAction,
  createSetSetlistAction,
  createSetLastGigStatsAction,
  createSetActiveEventAction,
  createAddToastAction,
  createRemoveToastAction,
  createSetGigModifiersAction,
  createResetStateAction,
  createConsumeItemAction,
  advanceDay as advanceDayAction,
  createStartTravelMinigameAction,
  createCompleteTravelMinigameAction,
  createStartRoadieMinigameAction,
  createCompleteRoadieMinigameAction,
  createStartKabelsalatMinigameAction,
  createCompleteKabelsalatMinigameAction,
  createStartAmpCalibrationAction,
  createCompleteAmpCalibrationAction,
  createUnlockTraitAction,
  dismissForeclosureNotice as dismissForeclosureNoticeAction,
  createSetPendingRiskEventAction,
  createAddUnlockAction,
  toggleNeuroDecimator as createToggleNeuroDecimatorAction,
} from './actionCreators'
import type { ApplySocialPostResultPayload } from '../types/actions'
import { validateSocialPostResult } from '../utils/postGig/socialPostResultValidation'
import type { SocialPostCommitResult } from '../utils/postGig/socialPostResultValidation'
import {
  purchaseChassis as purchaseChassisAction,
  installModule as installModuleAction,
  startCrowdfund as startCrowdfundAction
} from './assets/assetActionCreators'
import type { ToastType } from '../types/callbacks'

type BaseGameDispatchActions = {
  changeScene: (scene: Parameters<typeof createChangeSceneAction>[0]) => void
  updatePlayer: (
    updates: Parameters<typeof createUpdatePlayerAction>[0]
  ) => void
  updateBand: (updates: Parameters<typeof createUpdateBandAction>[0]) => void
  settleSoldMerch: (soldMerch: Record<string, number>) => void
  recordPendingGigSettlement: (
    settlement: Parameters<typeof createRecordPendingGigSettlementAction>[0]
  ) => void
  clearPendingGigSettlement: (id: string) => void
  toggleNeuroDecimator: (
    isActive: Parameters<typeof createToggleNeuroDecimatorAction>[0]
  ) => void
  /** Pays for a band meeting and restores harmony atomically. */
  holdBandMeeting: () => void
  /** Pays for one merch restock and adds the stock atomically. */
  restockMerch: (merchKey: string) => void
  updateSocial: (
    updates:
      Partial<SocialState> | ((prev: SocialState) => Partial<SocialState>)
  ) => void
  applyGigSocialReconciliation: (
    socialUpdate:
      Partial<SocialState> | ((prev: SocialState) => Partial<SocialState>),
    settlementId?: string | null
  ) => void
  commitSocialPost: (
    payload: ApplySocialPostResultPayload
  ) => SocialPostCommitResult
  setGameMap: (mapData: Parameters<typeof createSetMapAction>[0]) => void
  setCurrentGig: (gig: Parameters<typeof createSetGigAction>[0]) => void
  startGig: (gig: Parameters<typeof createStartGigAction>[0]) => void
  setSetlist: (list: Parameters<typeof createSetSetlistAction>[0]) => void
  setLastGigStats: (
    stats: Parameters<typeof createSetLastGigStatsAction>[0]
  ) => void
  /**
   * Replaces the active event directly.
   *
   * @internal Exposed as a test seam. `useEventSystem` uses it internally;
   * components go through `triggerEvent` / `resolveEvent`, and tests call it
   * to stage an event without rolling one.
   */
  setActiveEvent: (
    event: Parameters<typeof createSetActiveEventAction>[0]
  ) => void
  /**
   * Suppresses random scene-mount events so captures stay clean. Runtime-only
   * (`handleLoadGame` resets it). Supported API for in-app toggling; the
   * Playwright screenshot skill drives it through the DEV-only
   * `window.gameState.setScreenshotMode(true)` exposure
   * (`screenshot-state-inject.js`, `navigateToFixtureScene`).
   */
  setScreenshotMode: (enabled: boolean) => void
  triggerEvent: (category: string, triggerPoint?: string | null) => boolean
  resolveEvent: (choice: Record<string, unknown> | null) => {
    outcomeText: string
    description: string
    result: unknown
  }
  /** Queues a toast; returns its id (for `removeToast`), or null if dropped. */
  addToast: (
    message: Parameters<typeof createAddToastAction>[0],
    type?: ToastType
  ) => string | null
  removeToast: (id: Parameters<typeof createRemoveToastAction>[0]) => void
  setGigModifiers: (
    modifiers: Parameters<typeof createSetGigModifiersAction>[0]
  ) => void
  consumeItem: (itemId: Parameters<typeof createConsumeItemAction>[0]) => void
  advanceDay: () => void
  saveGame: (showToast?: boolean, stateSnapshot?: GameState) => void
  /**
   * Persists the state as of the next commit.
   *
   * @remarks
   * `onSaved` reports whether that write landed, for the one caller whose next
   * dispatch depends on it.
   */
  saveGameAfterStateCommit: (onSaved?: (saved: boolean) => void) => void
  loadGame: () => LoadGameResult
  /** What `loadGame` would do with the stored save, without doing it. */
  previewLoadGame: () => LoadPreviewResult
  deleteSave: () => void
  resetState: () => void
  /**
   * Lifts the save block a failed, unrecoverable migration set, for a new run
   * that starts without `resetState` (the Expedition). Never for a load. The
   * stored save also stops counting as this session's own (`hasOtherStoredSave`)
   * until the new run's first save lands.
   */
  releaseUnprotectedSlot: () => void
  /**
   * Whether a save is stored that this session has neither written nor
   * loaded, so starting a run without `resetState` would overwrite it unseen.
   */
  hasOtherStoredSave: () => boolean
  updateSettings: (
    settings: Parameters<typeof createUpdateSettingsAction>[0]
  ) => void
  startTravelMinigame: (
    payload: Parameters<typeof createStartTravelMinigameAction>[0]
  ) => void
  completeTravelMinigame: (
    damageTaken: Parameters<typeof createCompleteTravelMinigameAction>[0],
    itemsCollected: Parameters<typeof createCompleteTravelMinigameAction>[1]
  ) => void
  startRoadieMinigame: (
    payload: Parameters<typeof createStartRoadieMinigameAction>[0]
  ) => void
  completeRoadieMinigame: (
    equipmentDamage: Parameters<typeof createCompleteRoadieMinigameAction>[0],
    contrabandDelivered?: Parameters<
      typeof createCompleteRoadieMinigameAction
    >[1],
    deliveredStashItemId?: Parameters<
      typeof createCompleteRoadieMinigameAction
    >[2]
  ) => void
  startKabelsalatMinigame: (
    payload: Parameters<typeof createStartKabelsalatMinigameAction>[0]
  ) => void
  completeKabelsalatMinigame: (
    payload: Parameters<typeof createCompleteKabelsalatMinigameAction>[0]
  ) => void
  startAmpCalibration: (
    payload: Parameters<typeof createStartAmpCalibrationAction>[0]
  ) => void
  completeAmpCalibration: (
    score: Parameters<typeof createCompleteAmpCalibrationAction>[0],
    voidResonance?: Parameters<typeof createCompleteAmpCalibrationAction>[1],
    purgesUsed?: Parameters<typeof createCompleteAmpCalibrationAction>[2],
    hijacksOverridden?: Parameters<
      typeof createCompleteAmpCalibrationAction
    >[3],
    feedbackLoopsDampened?: Parameters<
      typeof createCompleteAmpCalibrationAction
    >[4]
  ) => void
  unlockTrait: (
    memberId: Parameters<typeof createUnlockTraitAction>[0],
    traitId: Parameters<typeof createUnlockTraitAction>[1]
  ) => void
  endGig: () => void
  setPendingBandHQOpen: (isOpen: boolean) => void
  setPendingSupplyStopInventory: (
    inventory: GameState['pendingSupplyStopInventory']
  ) => void
  dismissForeclosureNotice: (
    kind: Parameters<typeof dismissForeclosureNoticeAction>[0]
  ) => void
  setPendingRiskEvent: (
    event: Parameters<typeof createSetPendingRiskEventAction>[0]
  ) => void

  // Long-term asset actions — every helper takes the resolved input and
  // delegates to the asset action creators. Failures surface as typed
  // *_FAILED actions which the reducer handles as no-ops; the dispatch
  // boundary tracks them so middleware can translate to toasts in future.
  purchaseChassis: (
    input: Parameters<typeof purchaseChassisAction>[0]
  ) => boolean
  /** Returns creator acceptance and dispatch, not reducer completion. */
  upgradeChassisTier: (
    assetId: string,
    targetTier: import('../types/assets').ChassisTier
  ) => boolean
  /** Returns creator acceptance and dispatch, not reducer completion. */
  sellChassis: (assetId: string) => boolean
  repairChassis: (assetId: string) => boolean
  refinanceLiability: (
    liabilityId: string,
    loanProfileId: import('../utils/assets/loanProfiles').LoanProfileId
  ) => boolean
  /** Returns creator acceptance and dispatch, not reducer completion. */
  installModule: (input: Parameters<typeof installModuleAction>[0]) => boolean
  /** Returns wrapper acceptance and dispatch, not reducer completion. */
  removeModule: (assetId: string, slotId: string) => boolean
  startCrowdfund: (input: Parameters<typeof startCrowdfundAction>[0]) => void

  // Roguelite Expedition (G1). Creators read the same `latestStateRef`
  // snapshot the reducer validates against, so a prepared run's seed and the
  // previewed map cannot diverge.
  prepareExpeditionRun: () => void
  prepareExpeditionSponsorOffers: (
    regionId?: string,
    tourTypeId?: string,
    starterPerkId?: string | null
  ) => void
  startExpedition: (
    loadout: import('../types/expedition').ExpeditionLoadout
  ) => void
  revealExpeditionNodeIntel: (input: {
    nodeId: string
    source: import('../types/expedition').ExpeditionIntelSource
    grantId?: string
  }) => void
  /**
   * Typed G1 intent for banking one source-proven rare reward.
   *
   * @remarks
   * Composition-only in play: every reward source (route nodes, events,
   * Contacts, Contracts, the Finale) banks its entry through
   * `resolveExpeditionReward` inside the reducer commit that proves it. A
   * standalone dispatch is re-validated against the same proof and is a
   * no-op for anything already banked; no UI should call it.
   */
  addExpeditionReward: (input: {
    expectedRewardId: string
    sourceType: import('../types/expedition').ExpeditionRewardSourceType
    sourceId: string
  }) => void
  extractExpedition: (explicitRareRewardIds?: string[]) => void
  completeExpedition: (finaleResultId: string) => void
  acceptExpeditionFailure: () => void
  prepareNextExpedition: () => void
  resolveExpeditionCrisis: (
    choice: import('../types/actions').ResolveExpeditionCrisisPayload['choice']
  ) => void
  resolveExpeditionAuthorityExit: (
    exitId: import('../types/expedition').ExpeditionAuthorityExitId
  ) => void
  executeExpeditionRepair: (
    intent: import('../types/expedition').ExpeditionRepairIntent
  ) => void
  executeExpeditionInspection: (
    intent: import('../types/expedition').ExpeditionInspectionIntent
  ) => void
  claimExpeditionInsurance: (
    payload: import('../types/expedition').ExpeditionInsuranceClaimInput
  ) => void
  acceptExpeditionTechnicalFailure: () => void
  recordExpeditionCrewStressSource: (
    crewId: string,
    sourceType: import('../types/expedition').ExpeditionCrewStressSourceType,
    sourceId: string
  ) => void
  /**
   * Typed G3 intent for a Crew-event relationship change.
   *
   * @remarks
   * Composition-only in play: the reducer applies this inside
   * `applyResolvedCrewEventOutcome` in the same commit that resolves the Crew
   * event, then drops that event's proof. A standalone dispatch is therefore
   * refused by design (`hasResolvedEventProof`); no UI should call it.
   */
  recordExpeditionRelationshipOutcome: (
    input: Omit<
      import('../types/expedition').ExpeditionRelationshipOutcomeIntent,
      'expectedRouteStep'
    >
  ) => void
  /**
   * Typed G3 intent for a Crew injury advance.
   *
   * @remarks
   * Composition-only, like {@link GameDispatchActions.recordExpeditionRelationshipOutcome}:
   * applied inside `applyResolvedCrewEventOutcome`; a standalone dispatch is
   * refused by `hasResolvedEventProof`.
   */
  advanceExpeditionCrewInjury: (crewId: string, sourceId: string) => void
  /**
   * Typed G3 intent for a Band injury advance.
   *
   * @remarks
   * Composition-only: applied inside `applyResolvedCrewEventOutcome`; a
   * standalone dispatch is refused by `hasResolvedEventProof`.
   */
  advanceExpeditionBandInjury: (memberId: string, sourceId: string) => void
  /**
   * Typed G3 intent for a Contact intel grant.
   *
   * @remarks
   * Composition-only: the resolved Contact event creates the grant inside
   * `applyResolvedCrewEventOutcome`; a standalone dispatch is refused by
   * `hasResolvedEventProof`. Players spend the grant through
   * `revealExpeditionNodeIntel`.
   */
  createContactIntelGrant: (
    eventId: string,
    optionId: string,
    nodeId: string
  ) => void
  recordExpeditionObligationSignal: (
    signalType: import('../types/actions').RecordExpeditionObligationSignalPayload['signalType'],
    sourceId: string | null
  ) => void
  doubleDownExpeditionObligation: (
    obligationId: string,
    offerId: string
  ) => void
  offerExpeditionDraft: (
    sourceType: import('../types/expedition').ExpeditionRunDraftOffer['sourceType'],
    sourceKey: string
  ) => void
  selectExpeditionDraft: (
    traitId: import('../types/expedition').ExpeditionRunDraftTraitId
  ) => void
  resolveExpeditionSocialResult: (
    resultId: import('../types/expedition').ExpeditionSocialResultId,
    postOptionId: string
  ) => void
  createSocialIntelGrant: (
    postOptionId: string,
    resultId: import('../types/expedition').ExpeditionSocialResultId,
    nodeId: string
  ) => void
  settleExpeditionCrewCareer: (runId: string) => void
  settleExpeditionCareerResult: (runId: string) => void
  /**
   * Raises one HQ facility by a level.
   *
   * @param facilityId - Facility to build.
   * @param expectedLevel - The level the caller saw, used as the stale guard.
   * @returns True when the reducer accepted the purchase and it was dispatched.
   *
   * @remarks
   * Legality is asked of the reducer itself, as `purchaseExpeditionUnlockSet`
   * does. A refusal toasts its reason and saves nothing; a purchase persists
   * itself, because no scene transition will carry it.
   */
  purchaseExpeditionHqFacility: (
    facilityId: string,
    expectedLevel: number
  ) => boolean
  unlockExpeditionAscension: (runId: string) => void
  /**
   * Typed G5 intent for one Archive discovery.
   *
   * @remarks
   * The START and terminal transitions already sweep every provable
   * observation through the same handler (`recordExpeditionArchiveObservations`),
   * so a standalone dispatch is a redundant no-op for anything the run has met.
   */
  recordExpeditionArchiveDiscovery: (
    category: string,
    id: string,
    sourceId: string
  ) => void
  generateExpeditionBetweenTourDecisions: (runId: string) => void
  resolveExpeditionBetweenTourDecision: (
    runId: string,
    decisionId: string,
    optionId: string
  ) => void
  /**
   * Typed G3 intent for acquiring a Crew signature trait.
   *
   * @remarks
   * Composition-only in play: the Between-Tour `crew_debrief` decision's
   * `develop_signature` answer applies `handleAcquireExpeditionCrewSignature`
   * inside `resolveExpeditionBetweenTourDecision` (plan 03 Task 9). A
   * standalone dispatch needs the same Career-development proof; no UI should
   * call it.
   */
  acquireExpeditionCrewSignature: (
    crewId: string,
    expectedTraitId: string,
    sourceId: string
  ) => void
  /**
   * Buys one unlock set through the crash-safe journal.
   *
   * @param setId - Set to buy.
   * @returns True when the purchase was legal and has been opened.
   *
   * @remarks
   * The whole three-step sequence behind one command: debit and open the
   * journal entry, persist the marker, then grant - or refund if the marker
   * did not survive. Exposing the steps individually would let a caller debit
   * without ever committing, which is the state the journal exists to make
   * recoverable rather than reachable.
   *
   * The marker is written from the committed post-debit state, so the grant
   * lands one commit after this returns. `false` still means nothing was
   * taken - the refusal's reason is toasted - and `true` means the sequence
   * is under way and will finish by granting or refunding. The command toasts
   * that outcome itself once the marker write settles, so a caller must not
   * announce the purchase on `true`.
   */
  purchaseExpeditionUnlockSet: (setId: string) => boolean
  /**
   * Claims the Legendary a finalized Finale earned.
   *
   * @remarks
   * The durable marker is the barrier: it is written before anything is
   * granted, and a failed write mints nothing at all, so the caller may offer
   * a retry rather than having to reconcile a half-award.
   *
   * The three outcomes are deliberately distinguishable, because a caller has
   * to treat two of them differently from each other and from success: a run
   * that owes nothing (`not_applicable`) may settle at once, while a run that
   * owes a Legendary it could not durably record (`persistence_failed`) must
   * not be settled at all until the claim succeeds. Collapsing those two into
   * one falsy answer is what let settlement proceed over a lost award.
   */
  claimExpeditionLegendaryReward: (runId: string) => ExpeditionLegendaryClaim
}

/**
 * Stable command surface exposed by GameStateProvider for mutating game state.
 */
export type GameDispatchActions = BaseGameDispatchActions &
  FacilityDispatchActions &
  QuestDispatchActions &
  RivalBandDispatchActions

/**
 * The plain `dispatch(creator(payload))` wrappers, which depend on `dispatch`
 * alone and are therefore built in a single memo.
 */

interface UseGameDispatchActionsProps {
  dispatch: Dispatch<GameAction>
  state: GameState
  latestStateRef: MutableRefObject<GameState>
  tRef: MutableRefObject<TFunction>
  resetMapGenerationRetries: () => void
}

/**
 * Creates the memoized dispatch action bundle used by GameStateProvider.
 *
 * @param props - Dispatch dependencies, current state snapshots, translator ref, and map retry reset callback.
 * @returns Stable game action methods for reducers, persistence, events, minigames, and assets.
 */
export function useGameDispatchActions({
  dispatch,
  state,
  latestStateRef,
  tRef,
  resetMapGenerationRetries
}: UseGameDispatchActionsProps): GameDispatchActions {
  const storage = useStorage()

  // `changeScene` and `addToast` stay separate: the persistence and event
  // sub-hooks below take them as inputs, so they must exist before the bundle.
  const changeScene = useCallback(
    (scene: Parameters<typeof createChangeSceneAction>[0]) =>
      startTransition(() => dispatch(createChangeSceneAction(scene))),
    [dispatch]
  )

  const addToast = useCallback(
    (
      message: Parameters<typeof createAddToastAction>[0],
      type: Parameters<typeof createAddToastAction>[1] = 'info'
    ) => {
      const action = createAddToastAction(message, type)
      if (!action) return null
      dispatch(action)
      return action.payload.id
    },
    [dispatch]
  )

  const {
    deleteSave,
    saveGame,
    saveGameAfterStateCommit,
    loadGame,
    previewLoadGame,
    releaseUnprotectedSlot,
    hasOtherStoredSave
  } = usePersistence({
    currentScene: state.currentScene,
    stateRef: latestStateRef,
    dispatch,
    addToast,
    tRef
  })

  const { setActiveEvent, setScreenshotMode, triggerEvent, resolveEvent } =
    useEventSystem({
      latestStateRef,
      dispatch,
      addToast,
      changeScene,
      saveGame,
      tRef
    })

  const simpleActions = useSimpleDispatchActions(dispatch)

  const resetState = useCallback(() => {
    resetMapGenerationRetries()
    // Lifts the save block a failed, unrecoverable migration set. A new tour
    // only starts from the menu through the existing-save prompt while a save
    // is stored, so the player has confirmed replacing it. The Expedition
    // releases it itself when its run is committed (TourPrep).
    releaseUnprotectedSlot()
    // Same adapter initialization, save/load, and event unlocks use: reading
    // the module default here would let a reset overwrite the injected
    // backend's unlocks (or stored settings) with whatever sits in browser
    // storage.
    dispatch(createResetStateAction({ unlocks: getUnlocks(storage) }, storage))
  }, [dispatch, releaseUnprotectedSlot, resetMapGenerationRetries, storage])

  const advanceDay = useCallback(() => {
    // The reduced state, not the last render: a dispatch earlier in the same
    // tick (another day tick) must feed this action's RNG seed and stream.
    const currentState = latestStateRef.current
    const nextDay = currentState.player.day + 1
    try {
      dispatch(advanceDayAction(currentState))
    } catch (error) {
      handleError(
        new StateError('Failed to advance day', {
          originalError: error instanceof Error ? error.message : String(error)
        }),
        { source: 'GameState.advanceDay', silent: true }
      )
      addToast(
        tRef.current('ui:error.advanceDayFailed', {
          defaultValue: 'Could not advance day. Please try again.'
        }),
        'error'
      )
      return
    }
    addToast(tRef.current('ui:day_advance', { day: nextDay }), 'info')
  }, [dispatch, addToast, latestStateRef, tRef])

  const { setPendingBandHQOpen } = simpleActions
  const endGig = useCallback(() => {
    const currentState = latestStateRef.current
    if (currentState.currentGig?.isPractice) {
      addToast(tRef.current('ui:gig.practiceComplete'), 'success')
      const rawTarget = currentState.currentGig.sourceScene
      const isValidTarget =
        rawTarget !== undefined &&
        PRACTICE_RETURN_SCENES.has(rawTarget as GamePhase)
      const targetScene = isValidTarget ? rawTarget : GAME_PHASES.OVERWORLD
      // Product decision: returning from PRACTICE must ALWAYS reopen the Band HQ,
      // regardless of whether the source scene was OVERWORLD or MENU. Do NOT gate
      // setPendingBandHQOpen on targetScene === OVERWORLD — that breaks the MENU
      // return path. (Raised in review more than once; the unconditional open is
      // intentional.)
      setPendingBandHQOpen(true)
      changeScene(targetScene as GamePhase)
    } else {
      changeScene(GAME_PHASES.POST_GIG)
    }
  }, [addToast, changeScene, setPendingBandHQOpen, latestStateRef, tRef])

  const minigameActions = useMinigameDispatchActions(dispatch)
  const facilityActions = useFacilityDispatchActions(dispatch)
  const questActions = useQuestDispatchActions(dispatch)
  const rivalBandActions = useRivalBandDispatchActions({
    dispatch,
    stateRef: latestStateRef
  })
  const assetActions = useAssetDispatchActions({
    dispatch,
    stateRef: latestStateRef,
    addToast,
    tRef
  })
  const expeditionActions = useExpeditionDispatchActions({
    dispatch,
    stateRef: latestStateRef
  })
  const careerActions = useCareerDispatchActions(dispatch)

  const commitSocialPost = useCallback(
    (payload: ApplySocialPostResultPayload): SocialPostCommitResult => {
      const before = latestStateRef.current
      const action = createApplySocialPostResultAction(before, payload)
      if (action) {
        dispatch(action)
        // `dispatch` reduces synchronously, so a changed state is the reducer's
        // own answer, not a prediction.
        if (latestStateRef.current !== before) return { ok: true }
      }
      return {
        ok: false,
        reason: validateSocialPostResult(latestStateRef.current, payload)
      }
    },
    [dispatch, latestStateRef]
  )

  // A resolved decision is persisted Career state that changes nothing about
  // the scene, so the write has to travel with the dispatch: the autosave the
  // player would otherwise wait for fires on a scene transition, and a crash
  // after paying for rehab but before the last answer restored the open
  // decision and let the same choice be taken twice. Answering is the command,
  // so the save belongs here rather than in the one scene that renders it.
  const resolveExpeditionBetweenTourDecision = useCallback(
    (runId: string, decisionId: string, optionId: string) => {
      careerActions.resolveExpeditionBetweenTourDecision(
        runId,
        decisionId,
        optionId
      )
      saveGameAfterStateCommit()
    },
    [careerActions, saveGameAfterStateCommit]
  )

  // The Career purchases' failure toast: the same `<prefix>.<reason>` shape the
  // asset `dispatchWithFailureToast` uses. Career actions have no typed
  // `*_FAILED` variant - the reducer refuses by returning the identical state -
  // so the reason is named by the domain blocker, and `stale` covers a refusal
  // none of them explains.
  const toastCareerPurchaseFailure = useCallback(
    (blocker: ExpeditionCareerPurchaseBlocker | null) => {
      addToast(
        tRef.current(`ui:expedition.meta.purchaseFailed.${blocker ?? 'stale'}`),
        'error'
      )
    },
    [addToast, tRef]
  )

  const purchaseExpeditionHqFacility = useCallback(
    (facilityId: string, expectedLevel: number): boolean => {
      // `latestStateRef` already holds every dispatch of this batch, so a
      // second click sees the level the first one bought.
      const base = latestStateRef.current
      // A repeat of a build already honoured (a double click) is not a refusal
      // the player needs explained.
      if (getExpeditionHqFacilityLevel(base.career, facilityId) > expectedLevel)
        return false
      const action = createPurchaseExpeditionHqFacilityAction(
        facilityId,
        expectedLevel
      )
      // Asked of the reducer, as the unlock purchase does: a refused purchase
      // returns the identical state.
      if (gameReducer(base, action) === base) {
        toastCareerPurchaseFailure(
          getExpeditionHqFacilityPurchaseBlocker(base.career, facilityId)
        )
        return false
      }
      dispatch(action)
      saveGameAfterStateCommit()
      return true
    },
    [
      dispatch,
      latestStateRef,
      saveGameAfterStateCommit,
      toastCareerPurchaseFailure
    ]
  )

  const purchaseExpeditionUnlockSet = useCallback(
    (setId: string): boolean => {
      // `latestStateRef` already holds every dispatch of this batch, so a
      // second purchase sees the first one's open journal entry.
      const base = latestStateRef.current
      // A repeat of the purchase already open (a double click) is not a refusal
      // the player needs explained: the first click is already being honoured.
      if (base.career.pendingUnlockPurchase?.setId === setId) return false
      // The reducer is the authority on whether this purchase is legal, so the
      // answer is taken from the reducer itself rather than re-checked here
      // against rules that could drift: a refused begin leaves no open entry.
      dispatch(createBeginExpeditionUnlockPurchaseAction(setId))
      if (
        latestStateRef.current.career.pendingUnlockPurchase?.setId !== setId
      ) {
        toastCareerPurchaseFailure(
          getExpeditionUnlockSetPurchaseBlocker(base.career, setId)
        )
        return false
      }

      // Persist the marker *before* granting, from the committed post-debit
      // render: it carries anything else dispatched in the same batch, so no
      // update of that batch is dropped from storage.
      //
      // The grant waits for that write, which is the whole point of the
      // journal: a process that dies in this window leaves a save saying
      // precisely what was taken and what for, and the load path settles it
      // rather than losing the balance.
      //
      // The outcome is toasted here, once it is known: a success toast at
      // dispatch time would announce a set the rollback may still take back.
      saveGameAfterStateCommit(saved => {
        if (!saved) {
          dispatch(createRollbackExpeditionUnlockPurchaseAction(setId))
          // A refused write still leaves the debited snapshot, marker and
          // all, in the session's memory fallback, which a same-session load
          // reads first and would settle into a granted set. Saving the
          // rolled-back state replaces it.
          saveGameAfterStateCommit()
          addToast(
            tRef.current('ui:expedition.meta.purchaseFailed.persistence'),
            'error'
          )
          return
        }
        dispatch(createCompleteExpeditionUnlockPurchaseAction(setId))
        addToast(
          tRef.current('ui:expedition.meta.setPurchased', {
            name: tRef.current(`ui:expedition.meta.set.${setId}`)
          }),
          'success'
        )
        // The granted state replaces the marker in storage at the next commit,
        // so an open entry is never left behind for the load path to settle.
        saveGameAfterStateCommit()
      })
      return true
    },
    [
      addToast,
      dispatch,
      latestStateRef,
      saveGameAfterStateCommit,
      tRef,
      toastCareerPurchaseFailure
    ]
  )

  const claimExpeditionLegendaryReward = useCallback(
    (runId: string): ExpeditionLegendaryClaim => {
      const base = latestStateRef.current
      // Derived here only to know *which* marker to write. The reducer derives
      // it again from the same outcome and refuses a mismatch, so this read
      // cannot choose the award - a stale one simply claims nothing.
      const candidate = resolveExpeditionLegendaryCandidate(base, runId)
      if (candidate === null) return 'not_applicable'
      // Persistence first, and it is a hard barrier: a Legendary that exists
      // only in this session's state would be silently gone on the next load,
      // and the Career would have spent its one claim on the run. A marker
      // kept in the session fallback is exactly that loss, so `session_only`
      // is refused here even though the unlock stays readable this session -
      // only a durable marker may buy the irreversible commit.
      const markerId = getExpeditionLegendaryMarkerId(candidate)
      if (addUnlockWithPersistence(markerId, storage) !== 'persisted') {
        return 'persistence_failed'
      }
      dispatch(createAddUnlockAction(markerId))
      dispatch(createCommitExpeditionLegendaryRewardAction(runId, candidate))
      saveGameAfterStateCommit()
      return 'claimed'
    },
    [dispatch, latestStateRef, saveGameAfterStateCommit, storage]
  )

  return useMemo(
    () => ({
      changeScene,
      addToast,
      setActiveEvent,
      setScreenshotMode,
      triggerEvent,
      resolveEvent,
      advanceDay,
      saveGame,
      saveGameAfterStateCommit,
      loadGame,
      previewLoadGame,
      deleteSave,
      resetState,
      releaseUnprotectedSlot,
      hasOtherStoredSave,
      endGig,
      ...simpleActions,
      ...minigameActions,
      ...facilityActions,
      ...questActions,
      ...rivalBandActions,
      ...assetActions,
      ...expeditionActions,
      ...careerActions,
      commitSocialPost,
      resolveExpeditionBetweenTourDecision,
      purchaseExpeditionHqFacility,
      purchaseExpeditionUnlockSet,
      claimExpeditionLegendaryReward
    }),
    [
      changeScene,
      addToast,
      setActiveEvent,
      setScreenshotMode,
      triggerEvent,
      resolveEvent,
      advanceDay,
      saveGame,
      saveGameAfterStateCommit,
      loadGame,
      previewLoadGame,
      deleteSave,
      resetState,
      releaseUnprotectedSlot,
      hasOtherStoredSave,
      endGig,
      simpleActions,
      minigameActions,
      facilityActions,
      questActions,
      rivalBandActions,
      assetActions,
      expeditionActions,
      careerActions,
      commitSocialPost,
      resolveExpeditionBetweenTourDecision,
      purchaseExpeditionHqFacility,
      purchaseExpeditionUnlockSet,
      claimExpeditionLegendaryReward
    ]
  )
}
