import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared'

export const MainMenuFeatures = ({ onClose }) => {
  const { t } = useTranslation()

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('ui:features.title')}
      contentClassName=''
    >
      <div className='flex flex-col gap-6 w-full mx-auto max-h-[80vh] overflow-y-auto overflow-x-hidden custom-scrollbar pr-2 sm:pr-4 pb-4'>
        {t('ui:featureList', { returnObjects: true }).map(section => (
          <div key={section.title} className='flex flex-col gap-2'>
            <h3 className='text-toxic-green font-mono text-xl md:text-2xl uppercase tracking-widest border-b border-toxic-green/30 pb-1'>
              {t(section.title)}
            </h3>
            <p className='text-ash-gray font-mono text-sm md:text-base leading-relaxed mb-2'>
              {t(section.description)}
            </p>

            {section.type === 'bullets' && section.items && (
              <ul className='list-none flex flex-col gap-2 pl-2 border-l border-toxic-green/20'>
                {section.items.map(item => {
                  const translatedItem = t(item)
                  const splitIdx = translatedItem.indexOf(':')
                  if (splitIdx > -1) {
                    return (
                      <li
                        key={item}
                        className='text-ash-gray font-mono text-sm md:text-base pl-2 relative before:content-["-"] before:absolute before:left-[-8px] before:text-toxic-green'
                      >
                        <span className='text-toxic-green font-bold'>
                          {translatedItem.substring(0, splitIdx + 1)}
                        </span>
                        {translatedItem.substring(splitIdx + 1)}
                      </li>
                    )
                  }
                  return (
                    <li
                      key={item}
                      className='text-ash-gray font-mono text-sm md:text-base pl-2 relative before:content-["-"] before:absolute before:left-[-8px] before:text-toxic-green'
                    >
                      {translatedItem}
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
                      {section.headers.map(header => (
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
                    {section.rows.map(row => (
                      <tr
                        key={row[0]}
                        className='border-b border-toxic-green/10 last:border-0'
                      >
                        {row.map(cell => (
                          <td
                            key={cell}
                            className={`p-2 ${cell === row[0] ? 'text-toxic-green/90 whitespace-nowrap align-top font-bold' : 'text-ash-gray align-top'}`}
                          >
                            {t(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
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
