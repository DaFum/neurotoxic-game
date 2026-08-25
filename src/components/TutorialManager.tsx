import { m, AnimatePresence } from 'motion/react'
import { useCallback, useRef } from 'react'
import { useTutorial } from '../hooks/useTutorial'

/**
 * Determines the appropriate Tailwind background color class for a tutorial progress dot.
 *
 * @param stepId - The index of the tutorial step represented by the dot
 * @param currentStep - The current active tutorial step index
 * @returns The CSS class string for the dot's background color
 */
const getStepColorClass = (stepId: number, currentStep: number): string => {
  if (stepId === currentStep) return 'bg-toxic-green'
  if (stepId < currentStep) return 'bg-toxic-green/40'
  return 'bg-ash-gray/30'
}

/**
 * Coordinates tutorial overlay rendering for the current tutorial step.
 *
 * @remarks
 * Subscribes to the tutorial context to display contextual onboarding
 * information. The overlay is positioned globally to appear above other UI elements.
 *
 * Deliberately **not** a modal dialog. The steps annotate live UI —
 * `map-container`, `hud-stats`, `game-canvas` — and the final step runs during
 * `GIG`/`PRACTICE` while instructing the player to hit notes, so trapping focus
 * here would block the minigame it is explaining. It is announced as a live
 * region instead; do not restore `role='dialog'`/`aria-modal`, which previously
 * hid the rest of the scene from assistive tech while leaving it Tab-reachable.
 *
 * @returns The animated tutorial region, or null if the tutorial is hidden or empty
 */
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
  const hasContent = isVisible && content !== null
  const activePanelRef = useRef<HTMLDivElement | null>(null)

  // Publish the panel's height as `--tutorial-inset` so bottom-anchored scenes
  // can reserve room for it. Narrow viewports have no space to place the panel
  // clear of the scene's own controls, and the app body is `overflow: hidden`,
  // so without this the panel sits on top of buttons that can then never be
  // tapped. Consumed by `MainMenu` under `max-sm`.
  //
  // A ref callback rather than an effect: the panel is keyed by `step`, so it
  // remounts on every step while `hasContent` stays true. An effect keyed on
  // `hasContent` would keep measuring the first step's now-detached element and
  // publish its height for the rest of the tutorial.
  const measurePanel = useCallback((panel: HTMLDivElement | null) => {
    const root = document.documentElement
    if (!panel) {
      root.style.removeProperty('--tutorial-inset')
      return
    }
    activePanelRef.current = panel
    const sync = () =>
      root.style.setProperty('--tutorial-inset', `${panel.offsetHeight + 24}px`)
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(panel)
    return () => {
      observer.disconnect()
      // A step change mounts the next panel before this one finishes its exit
      // animation, so only the panel still in charge may clear the inset.
      if (activePanelRef.current === panel) {
        activePanelRef.current = null
        root.style.removeProperty('--tutorial-inset')
      }
    }
  }, [])

  return (
    <AnimatePresence>
      {hasContent && (
        <m.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          role='region'
          aria-label={t('ui:tutorial.ariaLabel', { defaultValue: 'Tutorial' })}
          aria-live='polite'
          className='fixed inset-x-3 bottom-3 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-full sm:max-w-md z-(--z-tutorial)'
        >
          <div
            ref={measurePanel}
            className='bg-void-black border-2 border-toxic-green p-6 shadow-[0_0_20px_var(--color-toxic-green)] relative'
          >
            <div className='absolute -top-3 left-4 bg-void-black px-2 text-toxic-green font-bold text-xs border border-toxic-green'>
              {t('ui:tutorial.header', {
                current: step + 1,
                total: TOTAL_STEPS,
                defaultValue: `TUTORIAL ${step + 1}/${TOTAL_STEPS}`
              })}
            </div>

            <h3 className='text-xl text-star-white font-display mb-2'>
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
        </m.div>
      )}
    </AnimatePresence>
  )
}
