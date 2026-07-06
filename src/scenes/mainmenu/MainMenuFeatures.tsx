import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared'
import { logger } from '../../utils/logger'

type FeatureSection = {
  title: string
  description?: string
  type?: 'bullets' | 'table'
  items?: string[]
  headers?: string[]
  rows?: string[][]
}

const isStringArray = (arr: unknown): arr is string[] => {
  if (!Array.isArray(arr)) return false
  for (let i = 0; i < arr.length; i++) {
    if (typeof arr[i] !== 'string') return false
  }
  return true
}

const isFeatureSectionArray = (value: unknown): value is FeatureSection[] => {
  if (!Array.isArray(value)) return false
  for (let i = 0; i < value.length; i++) {
    const section = value[i]
    if (!section || typeof section !== 'object') return false
    const item = section as Record<string, unknown>
    if (
      typeof item.title !== 'string' ||
      (item.description !== undefined && typeof item.description !== 'string')
    ) {
      return false
    }
    if (item.items !== undefined && !isStringArray(item.items)) {
      return false
    }
    if (item.headers !== undefined && !isStringArray(item.headers)) {
      return false
    }
    if (item.rows !== undefined) {
      if (!Array.isArray(item.rows)) return false
      for (let j = 0; j < item.rows.length; j++) {
        if (!isStringArray(item.rows[j])) return false
      }
    }
  }
  return true
}

type FeatureBulletListProps = {
  items: string[]
}

const FeatureBulletList = ({ items }: FeatureBulletListProps) => {
  const { t } = useTranslation()

  return (
    <ul className='list-none flex flex-col gap-2 pl-2 border-l border-toxic-green/20'>
      {items.map((item: string) => {
        const translatedItem = t(item)
        const splitIdx = translatedItem.indexOf(':')
        return (
          <li
            key={item}
            className='text-ash-gray font-mono text-sm md:text-base pl-2 relative before:content-["-"] before:absolute before:-left-2 before:text-toxic-green'
          >
            {splitIdx > -1 ? (
              <>
                <span className='text-toxic-green font-bold'>
                  {translatedItem.substring(0, splitIdx + 1)}
                </span>
                {translatedItem.substring(splitIdx + 1)}
              </>
            ) : (
              translatedItem
            )}
          </li>
        )
      })}
    </ul>
  )
}

type FeatureTableProps = {
  headers: string[]
  rows: string[][]
  title: string
}

const FeatureTable = ({ headers, rows, title }: FeatureTableProps) => {
  const { t } = useTranslation()

  return (
    <div className='overflow-x-auto w-full border border-toxic-green/30 bg-void-black/50'>
      <table className='w-full text-left font-mono text-sm'>
        <thead className='bg-toxic-green/10 border-b border-toxic-green/30'>
          <tr>
            {headers.map((header: string) => (
              <th
                key={header}
                className='p-2 text-toxic-green uppercase font-normal'
              >
                {t(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: string[]) => {
            if (!row || row.length === 0) {
              logger.error('MainMenu', `empty row in section "${title}"`)
              return null
            }
            const rowKey = row[0]
            return (
              <tr
                key={rowKey}
                className='border-b border-toxic-green/10 last:border-0'
              >
                {row.map((cell: string, colIndex: number) => {
                  const dataStableKey = `${rowKey}-${colIndex}-${cell}`
                  return (
                    <td
                      key={dataStableKey}
                      className={`p-2 ${cell === rowKey ? 'max-w-32 sm:max-w-none text-toxic-green/90 whitespace-normal sm:whitespace-nowrap break-words align-top font-bold' : 'text-ash-gray align-top'}`}
                    >
                      {t(cell)}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Shows the main-menu feature overview overlay and close action.
 * @param props - Close callback for the feature list panel.
 */
export const MainMenuFeatures = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation()
  const featureListValue = t('ui:featureList', {
    returnObjects: true
  }) as unknown
  const featureList = isFeatureSectionArray(featureListValue)
    ? featureListValue
    : []

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('ui:features.title')}
      contentClassName=''
    >
      <div className='flex flex-col gap-6 w-full mx-auto max-h-[calc(100svh-4rem)] overflow-y-auto overflow-x-hidden custom-scrollbar pr-2 sm:pr-4 pb-4'>
        {featureList.map(section => (
          <div key={section.title} className='flex flex-col gap-2'>
            <h3 className='text-toxic-green font-mono text-xl md:text-2xl uppercase tracking-widest border-b border-toxic-green/30 pb-1'>
              {t(section.title)}
            </h3>
            {section.description && t(section.description) && (
              <p className='text-ash-gray font-mono text-sm md:text-base leading-relaxed mb-2'>
                {t(section.description)}
              </p>
            )}

            {section.type === 'bullets' && section.items && (
              <FeatureBulletList items={section.items} />
            )}

            {section.type === 'table' && section.headers && section.rows && (
              <FeatureTable
                headers={section.headers}
                rows={section.rows}
                title={section.title}
              />
            )}
          </div>
        ))}
      </div>
    </Modal>
  )
}
