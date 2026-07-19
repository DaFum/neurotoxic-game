import type { TFunction } from 'i18next'
import type { AssetModule } from '../../types/assets'
import { finiteNumberOr } from '../../utils/finiteNumber'
import { formatCurrency } from '../../utils/numberUtils'

/**
 * Resolves a module's localized description. Daily-revenue module descriptions
 * use a bare `{{amount}}` placeholder in locale JSON (no hardcoded currency);
 * the amount is formatted here from the module's canonical boni value.
 *
 * @param t - Translation function from `useTranslation`.
 * @param module - Module catalogue entry supplying id and boni.
 * @param language - Active i18n language for currency formatting.
 * @returns Localized description string (empty when the key is missing).
 */
export const getModuleDescription = (
  t: TFunction,
  module: AssetModule,
  language: string
): string =>
  t(`assets:module.${module.id}.description`, {
    defaultValue: '',
    amount: formatCurrency(
      finiteNumberOr(module.boni.baseDailyRevenueDelta, 0),
      language
    )
  })
