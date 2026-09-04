/**
 * Voluntary-extraction confirmation.
 */

import { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions, useGameSelector } from '../../context/GameState'
import { formatCurrency } from '../../utils/numberUtils'
import { Modal } from '../shared/Modal'
import { ActionButton } from '../shared/ActionButton'
import {
  getExplicitExtractionRareCarrySlots,
  settleExpedition,
  splitExpeditionRewardLedger
} from '../../domain/expedition/extraction'
import type { ExpeditionRewardLedgerEntry } from '../../types/expedition'

/**
 * Open state and dismissal for the extraction confirmation.
 */
export interface ExtractionDialogProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Confirms a voluntary extraction with its exact consequences.
 *
 * @param props - Open state and dismissal handler.
 *
 * @remarks
 * The design requires extraction consequences to be explicit *before*
 * confirmation, so the dialog names the retained and forfeited Cash/Fame and
 * every rare reward that would be abandoned. All of it comes from the same
 * `settleExpedition` / `splitExpeditionRewardLedger` resolvers the reducer
 * uses — a separate display calculation here is exactly the divergence that
 * would make a push-your-luck decision feel unfair.
 */
export const ExtractionDialog = memo(function ExtractionDialog({
  isOpen,
  onClose
}: ExtractionDialogProps) {
  const { t, i18n } = useTranslation('ui')
  const { extractExpedition } = useGameActions()
  const state = useGameSelector(current => current)
  const ledger = useGameSelector(current => current.expedition.rewardLedger)

  const [carriedIds, setCarriedIds] = useState<string[]>([])
  const carrySlots = getExplicitExtractionRareCarrySlots(state)

  const settlement = useMemo(
    () => settleExpedition(state, 'extracted', carriedIds),
    [carriedIds, state]
  )

  const unsecured = useMemo(
    () => ledger.filter(entry => !entry.secured),
    [ledger]
  )

  const abandonedIds = useMemo(
    () =>
      new Set(
        splitExpeditionRewardLedger(ledger, 'extracted', carriedIds, carrySlots)
          .abandonedRewardEntryIds
      ),
    [carriedIds, carrySlots, ledger]
  )

  const toggleCarried = useCallback(
    (entryId: string) => {
      setCarriedIds(current => {
        if (current.includes(entryId)) {
          return current.filter(id => id !== entryId)
        }
        // Silently ignoring the click past the cap would read as a broken
        // control, so the button is disabled instead (see `disabled` below).
        if (current.length >= carrySlots) return current
        return [...current, entryId]
      })
    },
    [carrySlots]
  )

  const handleConfirm = useCallback(() => {
    extractExpedition(carriedIds)
    onClose()
  }, [carriedIds, extractExpedition, onClose])

  const rewardLabel = (entry: ExpeditionRewardLedgerEntry): string =>
    t(`ui:expedition.reward.${entry.rewardDefinitionId}`, {
      defaultValue: entry.rewardDefinitionId
    })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('ui:expedition.extraction.title')}
    >
      <div
        className='flex flex-col gap-4'
        data-testid='expedition-extraction-dialog'
      >
        <p className='text-sm text-ash-gray'>
          {t('ui:expedition.extraction.description', {
            percent: Math.round(settlement.retentionRate * 100)
          })}
        </p>

        <dl className='grid grid-cols-2 gap-2 text-xs font-mono'>
          <dt className='text-ash-gray uppercase'>
            {t('ui:expedition.extraction.cashRetained')}
          </dt>
          <dd
            className='text-toxic-green'
            data-testid='expedition-extraction-retained'
          >
            {formatCurrency(settlement.moneyRetained, i18n.language)}
          </dd>
          <dt className='text-ash-gray uppercase'>
            {t('ui:expedition.extraction.cashForfeited')}
          </dt>
          <dd
            className='text-blood-red'
            data-testid='expedition-extraction-forfeited'
          >
            {formatCurrency(settlement.moneyForfeited, i18n.language)}
          </dd>
          <dt className='text-ash-gray uppercase'>
            {t('ui:expedition.extraction.fameRetained')}
          </dt>
          <dd className='text-toxic-green'>{settlement.fameRetained}</dd>
          <dt className='text-ash-gray uppercase'>
            {t('ui:expedition.extraction.fameForfeited')}
          </dt>
          <dd className='text-blood-red'>{settlement.fameForfeited}</dd>
        </dl>

        <section
          className='flex flex-col gap-2'
          aria-label={t('ui:expedition.extraction.carryLabel')}
        >
          <h4 className='text-xs uppercase tracking-widest text-toxic-green'>
            {t('ui:expedition.extraction.carryTitle', {
              count: carriedIds.length,
              max: carrySlots
            })}
          </h4>
          {unsecured.length === 0 ? (
            <p
              className='text-xs text-ash-gray'
              data-testid='expedition-extraction-no-rares'
            >
              {t('ui:expedition.extraction.noRares')}
            </p>
          ) : (
            <ul className='flex flex-col gap-2'>
              {unsecured.map(entry => {
                const isCarried = carriedIds.includes(entry.id)
                return (
                  <li key={entry.id}>
                    <button
                      type='button'
                      aria-pressed={isCarried}
                      disabled={!isCarried && carriedIds.length >= carrySlots}
                      data-testid={`expedition-extraction-carry-${entry.rewardDefinitionId}`}
                      onClick={() => toggleCarried(entry.id)}
                      className={`w-full min-h-11 px-3 py-2 text-left text-xs font-mono uppercase border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        isCarried
                          ? 'border-toxic-green bg-toxic-green/20 text-star-white'
                          : 'border-steel-gray text-ash-gray'
                      }`}
                    >
                      <span>{rewardLabel(entry)}</span>
                      <span className='block text-[0.625rem] text-blood-red'>
                        {abandonedIds.has(entry.id)
                          ? t('ui:expedition.extraction.willBeLost')
                          : t('ui:expedition.extraction.willBeKept')}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <div className='flex flex-col sm:flex-row gap-2'>
          <ActionButton
            onClick={handleConfirm}
            data-testid='expedition-extraction-confirm'
            className='flex-1'
          >
            {t('ui:expedition.extraction.confirm')}
          </ActionButton>
          <ActionButton
            onClick={onClose}
            variant='secondary'
            data-testid='expedition-extraction-cancel'
            className='flex-1 px-8 py-4 border-2 border-steel-gray text-ash-gray'
          >
            {t('ui:expedition.extraction.cancel')}
          </ActionButton>
        </div>
      </div>
    </Modal>
  )
})
