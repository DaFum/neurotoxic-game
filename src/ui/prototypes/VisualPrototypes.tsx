import { memo, useEffect, useState } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { secureRandom, getSafeUUID } from '../../utils/crypto'
import { BiohazardIcon, CorporateSeal } from '../shared/BrutalistUI'

interface Message {
  id: string | number
  user: string
  text: string
  type: 'system' | 'hate'
}

interface CorruptedTextProps {
  text: string
  delay?: number
}

interface TerminalLogLine {
  id: string
  key: string
  type: 'info' | 'warn' | 'ok' | 'error'
}

// 9. Terminal Readout (Log)
const FULL_LOG_KEYS: TerminalLogLine[] = [
  { id: 'log_1', key: 'ui:terminal.log1', type: 'info' },
  { id: 'log_2', key: 'ui:terminal.log2', type: 'info' },
  { id: 'log_3', key: 'ui:terminal.log3', type: 'ok' },
  { id: 'log_4', key: 'ui:terminal.log4', type: 'warn' },
  { id: 'log_5', key: 'ui:terminal.log5', type: 'info' },
  { id: 'log_6', key: 'ui:terminal.log6', type: 'info' },
  { id: 'log_7', key: 'ui:terminal.log7', type: 'error' },
  { id: 'log_8', key: 'ui:terminal.log8', type: 'info' }
]

export const TerminalReadout = memo(() => {
  const { t } = useTranslation(['ui'])
  const [lines, setLines] = useState<TerminalLogLine[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(0)

  useEffect(() => {
    if (currentIndex < FULL_LOG_KEYS.length) {
      const timer = setTimeout(
        () => {
          const nextLine = FULL_LOG_KEYS[currentIndex]
          if (nextLine === undefined) {
            console.warn(
              `Invariant: missing FULL_LOG_KEYS at currentIndex ${currentIndex}`
            )
            setCurrentIndex(currentIndex + 1)
            return
          }
          setLines(prev => [...prev, nextLine])
          setCurrentIndex(currentIndex + 1)
        },
        secureRandom() * 400 + 200
      ) // Random typing delay
      return () => clearTimeout(timer)
    }
  }, [currentIndex])

  return (
    <div className='w-full h-48 border border-toxic-green/30 bg-shadow-black p-4 font-mono text-xs overflow-y-auto flex flex-col gap-1 custom-scrollbar relative shadow-[inset_0_0_20px_var(--color-void-black)]'>
      {/* Scanline overlay */}
      <div className='absolute inset-0 pointer-events-none opacity-10 bg-[image:repeating-linear-gradient(transparent,transparent_2px,var(--color-toxic-green-20)_2px,var(--color-toxic-green-20)_4px)]'></div>

      {lines.map(line => (
        <div
          key={line.id}
          className={`${line.type === 'error' ? 'text-blood-red font-bold' : line.type === 'warn' ? 'text-warning-yellow' : 'text-toxic-green'} opacity-90 leading-relaxed`}
        >
          {t(line.key)}
        </div>
      ))}
      {currentIndex < FULL_LOG_KEYS.length && (
        <div className='w-2 h-3 bg-toxic-green animate-pulse mt-1'></div>
      )}
    </div>
  )
})


// 13. Corrupted Data Stream (Text Reveal Effect)
export const CorruptedText = memo(({ text, delay = 0 }: CorruptedTextProps) => {
  const [displayedText, setDisplayedText] = useState<string>('')
  const chars = '!<>-_\\/[]{}—=+*^?#________'

  useEffect(() => {
    let iteration = 0
    let interval: ReturnType<typeof setInterval> | null = null

    const startEffect = () => {
      interval = setInterval(() => {
        setDisplayedText(
          text
            .split('')
            .map((char: string, index: number) => {
              if (index < iteration) {
                return char
              }
              return chars[Math.floor(secureRandom() * chars.length)]
            })
            .join('')
        )

        if (iteration >= text.length) {
          if (interval != null) clearInterval(interval)
        }

        iteration += 1 / 3 // Speed of reveal
      }, 30)
    }

    const timeout: ReturnType<typeof setTimeout> = setTimeout(
      startEffect,
      delay
    )
    return () => {
      clearTimeout(timeout)
      if (interval != null) clearInterval(interval)
    }
  }, [text, delay])

  return <span className='font-mono'>{displayedText}</span>
})


// 16. Rhythm Lane Matrix (Simulation of the Rhythm Engine)
export const RhythmMatrix = memo(() => {
  const { t } = useTranslation(['ui'])
  const [hits, setHits] = useState<boolean[]>([false, false, false])

  const triggerHit = (index: number) => {
    setHits(prev => {
      const newHits = [...prev]
      newHits[index] = true
      return newHits
    })
    setTimeout(() => {
      setHits(prev => {
        const newHits = [...prev]
        newHits[index] = false
        return newHits
      })
    }, 150)
  }

  return (
    <div className='w-full h-64 bg-shadow-black border border-toxic-green/30 p-4 flex flex-col relative overflow-hidden'>
      <div className='text-[10px] opacity-50 tracking-[0.3em] absolute top-2 left-2 z-10'>
        {t('ui:rhythm.header')}
      </div>

      {/* 3 Lanes */}
      <div className='flex-1 flex justify-center gap-4 mt-6'>
        {['GUITAR', 'DRUMS', 'BASS'].map((lane, i) => {
          const localizedLane = t(`ui:rhythm.lane_${lane.toLowerCase()}`)
          return (
            <div
              key={lane}
              className='w-16 h-full border-x border-toxic-green/10 relative flex flex-col justify-end pb-2 group'
            >
              {/* Falling Note Simulation */}
              <div
                className={`absolute top-0 left-1/2 -translate-x-1/2 w-12 h-4 border-2 border-toxic-green bg-void-black animate-[drop_2s_linear_infinite] opacity-50`}
                style={{ animationDelay: `${i * 0.5}s` }}
              ></div>

              {/* Target Box */}
              <button
                type='button'
                className={`w-14 h-8 mx-auto border-2 transition-all duration-75 flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green
                  ${hits[i] ? 'bg-toxic-green border-toxic-green shadow-[0_0_20px_var(--color-toxic-green)] scale-110' : 'bg-void-black border-toxic-green/50 hover:border-toxic-green'}`}
                onMouseDown={() => triggerHit(i)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    if (e.key === ' ') e.preventDefault()
                    triggerHit(i)
                  }
                }}
                aria-label={t('ui:rhythm.hit_lane', { lane: localizedLane })}
                aria-pressed={hits[i]}
              >
                <span
                  className={`text-[8px] font-bold ${hits[i] ? 'text-void-black' : 'text-toxic-green/50'}`}
                >
                  {t('ui:rhythm.hit')}
                </span>
              </button>

              <span className='text-[10px] text-center mt-2 opacity-50 tracking-widest'>
                {localizedLane}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
})


// 17. Corporate Sellout Contract (Brand Deals)
export const SelloutContract = memo(() => {
  const { t } = useTranslation(['ui'])
  const [signed, setSigned] = useState(false)

  return (
    <div
      className={`w-full border-4 p-6 relative transition-all duration-500 ${signed ? 'border-toxic-green bg-toxic-green/5' : 'border-toxic-green/30 bg-void-black'}`}
    >
      <div className='absolute top-0 right-0 p-2 border-l border-b border-toxic-green/30 text-[8px] opacity-50'>
        {t('ui:contract.confidential')}
      </div>

      <h3 className='text-xl font-bold tracking-[0.2em] uppercase mb-4 border-b-2 border-toxic-green/30 pb-2'>
        {t('ui:contract.title')}
      </h3>

      <div className='text-xs leading-relaxed opacity-80 flex flex-col gap-3 font-mono'>
        <p>
          <Trans
            i18nKey='ui:contract.p1'
            components={[
              <span
                key='0'
                className='bg-toxic-green text-void-black font-bold px-1'
              />
            ]}
          />
        </p>
        <p>
          <Trans
            i18nKey='ui:contract.p2'
            components={[
              <span
                key='0'
                className='bg-toxic-green text-toxic-green select-none hover:text-void-black transition-colors'
              />
            ]}
          />
        </p>
        <p>
          <Trans
            i18nKey='ui:contract.warning'
            components={[
              <span
                key='0'
                className='bg-blood-red text-blood-red select-none'
              />
            ]}
          />
        </p>

        <div className='mt-4 border-t border-dashed border-toxic-green/50 pt-4 flex justify-between items-end'>
          <div className='flex flex-col gap-1 w-1/2'>
            <span className='text-[10px] opacity-50'>
              {t('ui:contract.sig')}
            </span>
            {signed ? (
              <span className='font-script text-2xl text-toxic-green -rotate-6 tracking-widest animate-pulse'>
                Neurotoxic
              </span>
            ) : (
              <button
                type='button'
                aria-label={t('ui:contract.sign_aria')}
                className='h-8 border-b-2 border-toxic-green w-full cursor-pointer hover:bg-toxic-green/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green flex items-center justify-center font-bold tracking-widest text-toxic-green/50 hover:text-toxic-green text-xs'
                onClick={() => setSigned(true)}
              >
                [ {t('ui:button.sign', { defaultValue: 'SIGN' })} ]
              </button>
            )}
          </div>

          <div
            className={`transition-all duration-500 ${signed ? 'opacity-100 scale-100' : 'opacity-0 scale-150'}`}
          >
            <CorporateSeal className='w-16 h-16 text-toxic-green' />
            <div className='text-[8px] text-center mt-1'>
              {t('ui:contract.sealed')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})


// 18. Toxic Hate Feed (Chatter Overlay)
export const ToxicChatter = memo(() => {
  const { t } = useTranslation(['ui'])
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, user: 'VOID_WALKER', text: 'ui:chatter.msg1', type: 'hate' },
    { id: 2, user: 'TRUE_SCUM', text: 'ui:chatter.msg2', type: 'hate' },
    {
      id: 3,
      user: 'SYS_ADMIN',
      text: 'ui:chatter.msg3',
      type: 'system'
    }
  ])

  useEffect(() => {
    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      const newHate = [
        'ui:chatter.random1',
        'ui:chatter.random2',
        'ui:chatter.random3',
        'ui:chatter.random4',
        'ui:chatter.random5'
      ]
      const uuid = getSafeUUID()
      const randomHate = newHate[Math.floor(secureRandom() * newHate.length)]
      setMessages(prev => {
        const uuidPrefix =
          typeof uuid === 'string' ? uuid.split('-')[0]?.toUpperCase() : null
        const newMsg: Message = {
          id: uuid,
          user: `USER_${uuidPrefix ?? t('ui:chatter.unknownUser', { defaultValue: 'UNK' })}`,
          text:
            typeof randomHate === 'string'
              ? randomHate
              : t('ui:chatter.emptyMessage', {
                  defaultValue: '...'
                }),
          type: 'hate'
        }
        return [...prev, newMsg].slice(-5) // Keep only last 5
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [t])

  return (
    <div className='w-full h-64 border border-toxic-green/30 bg-void-black p-4 flex flex-col justify-end relative shadow-[inset_0_0_20px_var(--color-toxic-green-5)]'>
      <div className='absolute top-2 left-2 text-[10px] tracking-widest opacity-50'>
        {t('ui:chatter.header')}
      </div>

      <div className='flex flex-col gap-2 overflow-hidden'>
        {messages.map((msg, i) => (
          <div
            key={msg.id}
            className={`text-xs p-2 animate-[slide-in_0.2s_ease-out] ${msg.type === 'system' ? 'border border-toxic-green bg-toxic-green/10' : 'border-l-2 border-toxic-green/30'}`}
            style={{ opacity: 0.4 + i * 0.15 }} // Fade out older messages
          >
            <span className='font-bold opacity-70'>[{msg.user}]: </span>
            <span
              className={`${msg.type === 'hate' ? 'chromatic-text' : 'text-toxic-green'}`}
            >
              {t(msg.text)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
})


// 19. Void Decryptor (Unlocks/Lore)
export const VoidDecryptor = memo(() => {
  const { t } = useTranslation(['ui'])
  const [decrypted, setDecrypted] = useState(false)
  const [glitchEffect, setGlitchEffect] = useState('')

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    if (!decrypted) {
      interval = setInterval(() => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*'
        let str = ''
        for (let i = 0; i < 15; i++)
          str += chars.charAt(Math.floor(secureRandom() * chars.length))
        setGlitchEffect(str)
      }, 50)
    }
    return () => {
      if (interval != null) clearInterval(interval)
    }
  }, [decrypted])

  const displayText = decrypted
    ? t('ui:decryptor.unlocked')
    : glitchEffect || t('ui:brutalist.glitchPlaceholder')

  return (
    <button
      type='button'
      className='w-full h-64 border-2 border-toxic-green/50 bg-abyss-black flex flex-col items-center justify-center p-6 relative group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan'
      onClick={() => setDecrypted(true)}
      aria-label={
        decrypted
          ? undefined
          : t('ui:decryptor.locked_aria', { defaultValue: 'Decrypt Data' })
      }
      aria-pressed={decrypted}
    >
      {/* Glitch Frame Corners */}
      <div className='absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-toxic-green transition-all duration-300 group-hover:p-2'></div>
      <div className='absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-toxic-green transition-all duration-300 group-hover:p-2'></div>

      <div
        className={`relative transition-all duration-700 ${decrypted ? 'scale-125' : 'scale-100 animate-[pulse_0.1s_infinite]'}`}
      >
        <BiohazardIcon
          className={`w-20 h-20 ${decrypted ? 'text-neon-cyan drop-shadow-[0_0_20px_var(--color-neon-cyan)]' : 'text-toxic-green-mutated'}`}
        />

        {/* Scrambler Overlay */}
        {!decrypted && (
          <div className='absolute inset-0 bg-void-black/50 backdrop-blur-[1px] flex items-center justify-center mix-blend-overlay'>
            <div className='w-full h-2 bg-toxic-green animate-[scan_1s_linear_infinite]'></div>
          </div>
        )}
      </div>

      <div
        className={`mt-6 font-mono text-xs tracking-[0.2em] font-bold ${decrypted ? 'text-star-white' : 'text-toxic-green/50'}`}
      >
        {displayText}
      </div>

      {!decrypted && (
        <div className='absolute bottom-4 text-[8px] opacity-50 animate-bounce text-neon-cyan'>
          {t('ui:decryptor.click')}
        </div>
      )}
    </button>
  )
})
