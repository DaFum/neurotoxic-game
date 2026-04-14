import { motion, AnimatePresence } from 'framer-motion'
import { useTutorial } from '../hooks/useTutorial'

const getStepColorClass = (stepId, currentStep) => {
  if (stepId === currentStep) return 'bg-toxic-green'
  if (stepId < currentStep) return 'bg-toxic-green/40'
  return 'bg-ash-gray/30'
}

export const TutorialManager = () => {
  const {
    step,
    content,
    isVisible,
    completeStep,
    skipTutorial,
    TOTAL_STEPS,
    TUTORIAL_STEPS,
    t
  } = useTutorial()

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          role='dialog'
          aria-label={t('ui:tutorial.ariaLabel', { defaultValue: 'Tutorial' })}
          aria-modal='true'
          className='fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[var(--z-tutorial)] w-full max-w-md'
        >
          <div className='bg-void-black/95 border-2 border-toxic-green p-6 shadow-[0_0_20px_var(--color-toxic-green)] relative'>
            <div className='absolute -top-3 left-4 bg-void-black px-2 text-toxic-green font-bold text-xs border border-toxic-green'>
              {t('ui:tutorial.header', {
                current: step + 1,
                total: TOTAL_STEPS,
                defaultValue: `TUTORIAL ${step + 1}/${TOTAL_STEPS}`
              })}
            </div>

            <h3 className='text-xl text-star-white font-[Metal_Mania] mb-2'>
              {content.title}
            </h3>
            <p className='text-ash-gray font-mono text-sm mb-4 leading-relaxed'>
              {content.text}
            </p>

            {/* Progress dots */}
            <div className='flex items-center gap-1.5 mb-4'>
              {TUTORIAL_STEPS.map(stepId => (
                <div
                  key={stepId}
                  className={`w-2 h-2 transition-colors ${getStepColorClass(stepId, step)}`}
                />
              ))}
            </div>

            <div className='flex justify-between items-center'>
              <button
                type='button'
                onClick={skipTutorial}
                className='text-xs text-ash-gray hover:text-star-white underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-2 focus-visible:ring-offset-void-black'
              >
                {t('ui:tutorial.skipAll', { defaultValue: 'SKIP ALL' })}
              </button>
              <button
                type='button'
                onClick={completeStep}
                className='bg-toxic-green text-void-black px-6 py-1.5 font-bold hover:bg-star-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-2 focus-visible:ring-offset-void-black'
              >
                {step < TOTAL_STEPS - 1
                  ? t('ui:tutorial.next', { defaultValue: 'NEXT' })
                  : t('ui:tutorial.done', { defaultValue: 'DONE' })}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
