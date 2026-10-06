/**
 * The run's route-intel surface: Scout reads, recon, and the tips Contacts and
 * Social posts earn.
 *
 * @remarks
 * Information is a build resource, so every reveal here spends something the
 * run actually holds - a committed Scout, a recon charge, or a grant a resolved
 * Contact event or Social result produced. Legality is never decided here: each
 * reveal asks the same resolver `REVEAL_EXPEDITION_NODE_INTEL` uses, and the
 * reducer re-validates the dispatch regardless.
 */

import { memo, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions, useGameSelector } from '../../context/GameState'
import { ActionButton } from '../shared/ActionButton'
import { buildExpeditionMap } from '../../domain/expedition/map'
import {
  getExpeditionIntelCapability,
  getExpeditionNodeIntelLevel,
  resolveExpeditionIntelReveal
} from '../../domain/expedition/nodeIntel'
import { EXPEDITION_SOCIAL_RESULTS } from '../../domain/expedition/social'
import { translateLocation } from '../../utils/locationI18n'
import type { GameState } from '../../types'
import type {
  ExpeditionNodeClass,
  ExpeditionSocialResultId,
  ExpeditionSpecialNodeSubtype,
  NodeIntelLevel
} from '../../types/expedition'

/** One onward node and what the run may reveal about it right now. */
interface IntelCandidate {
  nodeId: string
  /** The venue name the route map labels this node with, when it has one. */
  venueName: string | null
  /** 1-based left-to-right position among its route step's nodes on the map. */
  lane: number
  nodeClass: ExpeditionNodeClass
  specialSubtype: ExpeditionSpecialNodeSubtype | null
  level: NodeIntelLevel
  canPassive: boolean
  canRecon: boolean
  usableGrants: Array<{ id: string; source: 'social' | 'contact' }>
  canSocialTip: boolean
}

/** Everything the panel renders, derived in one selector pass. */
interface IntelView {
  isActive: boolean
  hasScout: boolean
  reconLeft: number
  candidates: IntelCandidate[]
  /** The settled Social result a tip would spend; both null when none fits. */
  socialPostOptionId: string | null
  socialResultId: ExpeditionSocialResultId | null
}

const INACTIVE_VIEW: IntelView = {
  isActive: false,
  hasScout: false,
  reconLeft: 0,
  candidates: [],
  socialPostOptionId: null,
  socialResultId: null
}

/**
 * Asks the canonical intel resolver what the run may reveal on its onward
 * nodes.
 *
 * @param state - Current game state.
 * @returns The panel's view model.
 *
 * @remarks
 * Candidates are the base-route neighbours of the node the run stands on: the
 * Contact and Social grant producers both target that same set, so a grant
 * always names a node this panel lists.
 */
const selectIntelView = (state: GameState): IntelView => {
  const expedition = state.expedition
  const loadout = expedition?.loadout
  if (expedition?.status !== 'active' || !loadout) return INACTIVE_VIEW
  const map = buildExpeditionMap(
    state.runSeed,
    loadout.tourTypeId,
    loadout.regionId
  )
  const currentNodeId = expedition.visitedNodeIds.at(-1)
  if (typeof currentNodeId !== 'string') return INACTIVE_VIEW
  const capability = getExpeditionIntelCapability(state)
  const routeStep = expedition.routeStep

  // The same proof `CREATE_SOCIAL_INTEL_GRANT` checks: a settled result from
  // this route step, not yet turned into a grant, whose registry entry
  // actually carries intel.
  const proof = expedition.lastSocialResult
  const socialTargetLevel =
    proof &&
    !proof.intelConsumed &&
    proof.resolvedAtRouteStep === routeStep &&
    state.player.currentNodeId === currentNodeId &&
    Object.hasOwn(EXPEDITION_SOCIAL_RESULTS, proof.resultId)
      ? EXPEDITION_SOCIAL_RESULTS[proof.resultId].intelTargetLevel
      : null

  const candidates: IntelCandidate[] = []
  for (const edge of map.connections) {
    if (edge.from !== currentNodeId) continue
    const meta = Object.hasOwn(map.meta, edge.to) ? map.meta[edge.to] : null
    if (!meta) continue
    const level = getExpeditionNodeIntelLevel(state, edge.to, capability)
    const ask = (
      source:
        'scout_passive' | 'scout_recon' | 'social_grant' | 'contact_grant',
      grantId?: string
    ): boolean =>
      level < 2 &&
      resolveExpeditionIntelReveal(
        state,
        {
          nodeId: edge.to,
          source,
          expectedLevel: level === 1 ? 1 : 0,
          expectedRouteStep: routeStep,
          ...(grantId === undefined ? {} : { grantId })
        },
        map,
        capability
      ).ok
    const venueName = map.nodes[edge.to]?.venue?.name
    candidates.push({
      nodeId: edge.to,
      venueName: typeof venueName === 'string' ? venueName : null,
      // `nodeOrder` lists a step's nodes in build order, which is also their
      // left-to-right order on the map.
      lane:
        map.nodeOrder
          .filter(id => map.meta[id]?.routeStep === meta.routeStep)
          .indexOf(edge.to) + 1,
      nodeClass: meta.nodeClass,
      specialSubtype: meta.specialSubtype,
      level,
      canPassive: ask('scout_passive'),
      canRecon: ask('scout_recon'),
      usableGrants: expedition.intelGrants
        .filter(
          grant =>
            grant.nodeId === edge.to &&
            ask(
              grant.source === 'social' ? 'social_grant' : 'contact_grant',
              grant.id
            )
        )
        .map(grant => ({ id: grant.id, source: grant.source })),
      // The grant the tip mints targets the result's level, and the resolver
      // only spends a grant one level above the node's effective intel - so
      // the tip is offered only where the grant it makes is usable now.
      canSocialTip:
        socialTargetLevel !== null && level + 1 === socialTargetLevel
    })
  }

  const hasSocialTip =
    proof !== null && candidates.some(candidate => candidate.canSocialTip)

  return {
    isActive: true,
    hasScout: capability.hasScout,
    reconLeft: Math.max(
      0,
      capability.reconCharges - expedition.scoutReconUsedRouteSteps.length
    ),
    candidates: reuseCandidates(candidates),
    socialPostOptionId: hasSocialTip ? proof.postOptionId : null,
    socialResultId: hasSocialTip ? proof.resultId : null
  }
}

/** The last candidate list handed out, and its content key. */
let lastCandidates: { key: string; value: IntelCandidate[] } | null = null

/**
 * Returns the previous candidate array when its content is unchanged.
 *
 * @remarks
 * `useGameSelector` compares the view shallowly, so a fresh array on every
 * store change would re-render the panel - and re-run its passive-read effect
 * - for state that has nothing to do with intel.
 */
const reuseCandidates = (candidates: IntelCandidate[]): IntelCandidate[] => {
  const key = JSON.stringify(candidates)
  if (lastCandidates?.key === key) return lastCandidates.value
  lastCandidates = { key, value: candidates }
  return candidates
}

/**
 * Renders the onward nodes' intel and every reveal the run may spend on them.
 */
export const ExpeditionIntelPanel = memo(function ExpeditionIntelPanel() {
  const { t } = useTranslation('ui')
  const view = useGameSelector(selectIntelView)
  const { revealExpeditionNodeIntel, createSocialIntelGrant } = useGameActions()

  // A Scout reads the road continuously, so the passive level-1 reveal is not
  // a button: it is spent as soon as the run stands next to a node it has not
  // read. Remembered per node id - a node is an onward candidate at exactly
  // one route step - so a refused reveal is not retried on every render.
  const passiveAttemptsRef = useRef(new Set<string>())
  useEffect(() => {
    for (const candidate of view.candidates) {
      if (!candidate.canPassive) continue
      if (passiveAttemptsRef.current.has(candidate.nodeId)) continue
      passiveAttemptsRef.current.add(candidate.nodeId)
      revealExpeditionNodeIntel({
        nodeId: candidate.nodeId,
        source: 'scout_passive'
      })
    }
  }, [revealExpeditionNodeIntel, view.candidates])

  if (!view.isActive || view.candidates.length === 0) return null
  const hasGrant = view.candidates.some(
    candidate => candidate.usableGrants.length > 0
  )
  const { socialPostOptionId, socialResultId } = view
  const hasSocialTip = socialPostOptionId !== null && socialResultId !== null
  if (!view.hasScout && !hasGrant && !hasSocialTip) return null

  return (
    <section
      className='mb-2 w-full border border-steel-gray bg-charcoal-gray p-2 flex flex-col gap-2 text-xs font-mono'
      data-testid='expedition-intel-panel'
      aria-label={t('ui:expedition.intel.title')}
    >
      <div className='flex flex-wrap items-baseline justify-between gap-2'>
        <h3 className='text-[0.625rem] uppercase tracking-widest text-toxic-green'>
          {t('ui:expedition.intel.title')}
        </h3>
        {view.hasScout ? (
          <span
            className='text-[0.625rem] text-ash-gray uppercase'
            data-testid='expedition-intel-recon-left'
          >
            {t('ui:expedition.intel.reconLeft', { count: view.reconLeft })}
          </span>
        ) : null}
      </div>
      {hasSocialTip ? (
        <p className='text-[0.625rem] text-ash-gray'>
          {t('ui:expedition.intel.socialTipHint')}
        </p>
      ) : null}
      <ul className='flex flex-col gap-2'>
        {view.candidates.map(candidate => (
          <li
            key={candidate.nodeId}
            className='flex flex-wrap items-center gap-2 border border-steel-gray bg-void-black px-2 py-1 text-star-white'
            data-testid={`expedition-intel-node-${candidate.nodeId}`}
          >
            <span
              className='text-toxic-green'
              data-testid={`expedition-intel-node-label-${candidate.nodeId}`}
            >
              {candidate.venueName
                ? `${translateLocation(t, candidate.venueName, t('ui:map.unknown'))} · `
                : null}
              {t('ui:expedition.intel.lane', { lane: candidate.lane })}
            </span>
            <span className='uppercase'>
              {candidate.specialSubtype
                ? t(`ui:expedition.node.subtype.${candidate.specialSubtype}`)
                : t(`ui:expedition.node.class.${candidate.nodeClass}`)}
            </span>
            <span className='text-ash-gray'>
              {t('ui:expedition.intel.level', { level: candidate.level })}
            </span>
            {candidate.canRecon ? (
              <ActionButton
                variant='secondary'
                className='px-3 py-1 text-xs border border-toxic-green text-toxic-green'
                data-testid={`expedition-intel-recon-${candidate.nodeId}`}
                onClick={() =>
                  revealExpeditionNodeIntel({
                    nodeId: candidate.nodeId,
                    source: 'scout_recon'
                  })
                }
              >
                {t('ui:expedition.intel.recon')}
              </ActionButton>
            ) : null}
            {candidate.usableGrants.map(grant => (
              <ActionButton
                key={grant.id}
                variant='secondary'
                className='px-3 py-1 text-xs border border-toxic-green text-toxic-green'
                data-testid={`expedition-intel-grant-${grant.source}-${candidate.nodeId}`}
                onClick={() =>
                  revealExpeditionNodeIntel({
                    nodeId: candidate.nodeId,
                    source:
                      grant.source === 'social'
                        ? 'social_grant'
                        : 'contact_grant',
                    grantId: grant.id
                  })
                }
              >
                {t(
                  grant.source === 'social'
                    ? 'ui:expedition.intel.useSocial'
                    : 'ui:expedition.intel.useContact'
                )}
              </ActionButton>
            ))}
            {candidate.canSocialTip &&
            socialPostOptionId !== null &&
            socialResultId !== null ? (
              <ActionButton
                variant='secondary'
                className='px-3 py-1 text-xs border border-steel-gray text-ash-gray'
                data-testid={`expedition-intel-social-tip-${candidate.nodeId}`}
                onClick={() =>
                  createSocialIntelGrant(
                    socialPostOptionId,
                    socialResultId,
                    candidate.nodeId
                  )
                }
              >
                {t('ui:expedition.intel.socialTip')}
              </ActionButton>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
})
