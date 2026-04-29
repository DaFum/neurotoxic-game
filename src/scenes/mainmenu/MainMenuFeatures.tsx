/*
 * (#1) Actual Updates: Added PropTypes.


 */
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import { Modal } from '../../ui/shared'

type FeatureSection = {
  title: string
  description: string
  type?: 'bullets' | 'table'
  items?: string[]
  headers?: string[]
  rows?: string[][]
}

const isFeatureSectionArray = (value: unknown): value is FeatureSection[] => {
  if (!Array.isArray(value)) return false
  return value.every(section => {
    if (!section || typeof section !== 'object') return false
    const item = section as Record<string, unknown>
    if (
      typeof item.title !== 'string' ||
      typeof item.description !== 'string'
    ) {
      return false
    }
    if (
      item.items !== undefined &&
      (!Array.isArray(item.items) ||
        item.items.some(elem => typeof elem !== 'string'))
    ) {
      return false
    }
    if (
      item.headers !== undefined &&
      (!Array.isArray(item.headers) ||
        item.headers.some(elem => typeof elem !== 'string'))
    ) {
      return false
    }
    if (
      item.rows !== undefined &&
      (!Array.isArray(item.rows) ||
        item.rows.some(
          row =>
            !Array.isArray(row) || row.some(cell => typeof cell !== 'string')
        ))
    ) {
      return false
    }
    return true
  })
}

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
      <div className='flex flex-col gap-6 w-full mx-auto max-h-[80vh] overflow-y-auto overflow-x-hidden custom-scrollbar pr-2 sm:pr-4 pb-4'>
        {featureList.map(section => (
          <div key={section.title} className='flex flex-col gap-2'>
            <h3 className='text-toxic-green font-mono text-xl md:text-2xl uppercase tracking-widest border-b border-toxic-green/30 pb-1'>
              {t(section.title)}
            </h3>
            <p className='text-ash-gray font-mono text-sm md:text-base leading-relaxed mb-2'>
              {t(section.description)}
            </p>

            {section.type === 'bullets' && section.items && (
              <ul className='list-none flex flex-col gap-2 pl-2 border-l border-toxic-green/20'>
                {section.items.map((item: string) => {
                  const translatedItem = t(item)
                  const splitIdx = translatedItem.indexOf(':')
                  return (
                    <li
                      key={item}
                      className='text-ash-gray font-mono text-sm md:text-base pl-2 relative before:content-["-"] before:absolute before:left-[-8px] before:text-toxic-green'
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
            )}

            {section.type === 'table' && section.headers && section.rows && (
              <div className='overflow-x-auto w-full border border-toxic-green/30 bg-void-black/50'>
                <table className='w-full text-left font-mono text-sm'>
                  <thead className='bg-toxic-green/10 border-b border-toxic-green/30'>
                    <tr>
                      {section.headers.map((header: string) => (
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
                    {section.rows.map((row: string[]) => {
                      if (!row || row.length === 0) {
                        throw new Error(
                          `MainMenuFeatures: empty row in section "${section.title}"`
                        )
                      }
                      const rowKey = row[0]
                      return (
                        <tr
                          key={rowKey}
                          className='border-b border-toxic-green/10 last:border-0'
                        >
                          {row.map((cell: string) => (
                            <td
                              key={`${rowKey}-${cell}`}
                              className={`p-2 ${cell === rowKey ? 'text-toxic-green/90 whitespace-nowrap align-top font-bold' : 'text-ash-gray align-top'}`}
                            >
                              {t(cell)}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </Modal>
  )
}

MainMenuFeatures.propTypes = {
  onClose: PropTypes.func.isRequired
}
