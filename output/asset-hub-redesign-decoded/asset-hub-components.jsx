/* global React */
const { useState, useEffect, useRef, useContext } = React

// Shared runtime context (driven by Tweaks)
const NTXContext = React.createContext({ artOn: true })

// ─────────────────────────────────────────────
//  Icons — minimal geometric line set
// ─────────────────────────────────────────────
function Icon({ name, size = 18, stroke = 'currentColor', sw = 2 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke,
    strokeWidth: sw,
    strokeLinecap: 'square',
    strokeLinejoin: 'miter'
  }
  switch (name) {
    case 'bus':
      return (
        <svg {...common}>
          <rect x='3' y='5' width='18' height='12' />
          <line x1='3' y1='11' x2='21' y2='11' />
          <circle cx='7.5' cy='19' r='1.4' />
          <circle cx='16.5' cy='19' r='1.4' />
        </svg>
      )
    case 'sliders':
      return (
        <svg {...common}>
          <line x1='5' y1='3' x2='5' y2='21' />
          <line x1='12' y1='3' x2='12' y2='21' />
          <line x1='19' y1='3' x2='19' y2='21' />
          <rect x='3' y='8' width='4' height='3' />
          <rect x='10' y='13' width='4' height='3' />
          <rect x='17' y='6' width='4' height='3' />
        </svg>
      )
    case 'house':
      return (
        <svg {...common}>
          <path d='M4 11 L12 4 L20 11 V20 H4 Z' />
          <line x1='10' y1='20' x2='10' y2='14' />
          <line x1='14' y1='20' x2='14' y2='14' />
        </svg>
      )
    case 'shirt':
      return (
        <svg {...common}>
          <path d='M8 4 L4 7 L6 10 L8 9 V20 H16 V9 L18 10 L20 7 L16 4 L14 6 H10 Z' />
        </svg>
      )
    case 'wrench':
      return (
        <svg {...common}>
          <path d='M15 4 a4 4 0 0 0 -5 5 L4 15 l3 3 l6-6 a4 4 0 0 0 5-5 l-3 3 l-2-2 Z' />
        </svg>
      )
    case 'up':
      return (
        <svg {...common}>
          <line x1='12' y1='20' x2='12' y2='5' />
          <path d='M6 11 L12 5 L18 11' />
        </svg>
      )
    case 'tag':
      return (
        <svg {...common}>
          <path d='M4 4 H12 L20 12 L12 20 L4 12 Z' />
          <circle cx='8.5' cy='8.5' r='1.2' />
        </svg>
      )
    case 'plus':
      return (
        <svg {...common}>
          <line x1='12' y1='5' x2='12' y2='19' />
          <line x1='5' y1='12' x2='19' y2='12' />
        </svg>
      )
    case 'x':
      return (
        <svg {...common}>
          <line x1='6' y1='6' x2='18' y2='18' />
          <line x1='18' y1='6' x2='6' y2='18' />
        </svg>
      )
    case 'down':
      return (
        <svg {...common}>
          <line x1='12' y1='4' x2='12' y2='19' />
          <path d='M6 13 L12 19 L18 13' />
        </svg>
      )
    case 'skull':
      return (
        <svg {...common}>
          <path d='M6 5 h12 v8 l-2 2 v3 h-8 v-3 l-2-2 Z' />
          <rect x='8' y='9' width='2.5' height='2.5' />
          <rect x='13.5' y='9' width='2.5' height='2.5' />
        </svg>
      )
    case 'coin':
      return (
        <svg {...common}>
          <circle cx='12' cy='12' r='8' />
          <line x1='12' y1='8' x2='12' y2='16' />
          <path d='M14 9.5 a2.4 2.4 0 0 0 -3.5 .5 c-.6 1 .5 1.8 1.5 2 s2.1 1 1.5 2 a2.4 2.4 0 0 1 -3.5 .5' />
        </svg>
      )
    default:
      return null
  }
}

// ─────────────────────────────────────────────
//  Generated image (Pollinations) with loading + fallback
// ─────────────────────────────────────────────
function GenImage({ prompt, w, h, alt, className, style, accent }) {
  const { artOn } = useContext(NTXContext)
  const [state, setState] = useState('loading') // loading | ok | error
  const [src, setSrc] = useState('')
  useEffect(() => {
    if (!artOn) {
      setSrc('')
      setState('loading')
      return
    }
    setState('loading')
    setSrc(window.NTX.genImageUrl(prompt, w, h))
  }, [prompt, w, h, artOn])

  if (!artOn) {
    return (
      <div className={'genimg ' + (className || '')} style={style}>
        <div className='genimg-ph genimg-ph--off'>
          <span className='ntx-mono genimg-label'>
            {(alt || 'ART').toUpperCase()}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={'genimg ' + (className || '')} style={style}>
      {state !== 'ok' && (
        <div className='genimg-ph' data-state={state}>
          <div className='genimg-scan' />
          <span className='ntx-mono genimg-label'>
            {state === 'loading' ? 'RENDERING…' : 'SIGNAL LOST'}
          </span>
        </div>
      )}
      {src && (
        <img
          src={src}
          alt={alt || ''}
          draggable='false'
          onLoad={() => setState('ok')}
          onError={() => setState('error')}
          style={{ opacity: state === 'ok' ? 1 : 0 }}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
//  Condition gauge — segmented brutalist bar
// ─────────────────────────────────────────────
function ConditionGauge({ value, accent }) {
  const segs = 10
  const filled = Math.round((value / 100) * segs)
  const tone = value < 20 ? '#ff4646' : value < 50 ? '#ffcc00' : accent
  return (
    <div className='gauge'>
      <div className='gauge-head'>
        <span className='ntx-mono gauge-cap'>ZUSTAND</span>
        <span className='ntx-mono gauge-val' style={{ color: tone }}>
          {value}%
        </span>
      </div>
      <div className='gauge-track'>
        {Array.from({ length: segs }).map((_, i) => (
          <span
            key={i}
            className='gauge-seg'
            style={{ background: i < filled ? tone : 'rgba(255,255,255,0.08)' }}
          />
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
//  Status header — cash hero + stat chips
// ─────────────────────────────────────────────
function StatusHeader({ accent }) {
  const s = window.NTX.STATUS
  const f = window.NTX.fmtEuro
  return (
    <header className='status'>
      <div className='status-cash'>
        <span className='ntx-mono status-cap'>CASH</span>
        <div className='status-amt'>
          <span
            className='ntx-title'
            style={{ color: s.cash < 0 ? '#ff4646' : accent }}
          >
            {f(s.cash)}
          </span>
        </div>
      </div>
      <div className='status-chips'>
        <div className='schip schip--danger'>
          <Icon name='down' size={13} />
          <div>
            <span className='ntx-mono schip-cap'>PRO TAG</span>
            <strong className='ntx-mono'>{f(s.daily)}</strong>
          </div>
        </div>
        <div className='schip schip--warn'>
          <div>
            <span className='ntx-mono schip-cap'>SCHULDEN</span>
            <strong className='ntx-mono'>{f(s.debt)}</strong>
          </div>
        </div>
      </div>
    </header>
  )
}

// ─────────────────────────────────────────────
//  Hotspot — slot marker positioned on the hero image
// ─────────────────────────────────────────────
function Hotspot({ slot, layout, accent, onClick }) {
  const mod = slot.installed ? window.NTX.findModule(slot.installed) : null
  const filled = !!mod

  if (layout === 'point') {
    const { x, y } = slot.pos
    return (
      <button
        className={'hot hot--point' + (filled ? ' hot--filled' : ' hot--empty')}
        style={{ left: x * 100 + '%', top: y * 100 + '%', '--acc': accent }}
        onClick={onClick}
        aria-label={mod ? slot.name + ': ' + mod.name : slot.name + ' — leer'}
        title={mod ? slot.name + ': ' + mod.name : slot.name}
      >
        {filled ? (
          <GenImage
            className='hot-img'
            prompt={window.NTX.modulePrompt(mod.name)}
            w={128}
            h={128}
            alt={mod.name}
            accent={accent}
          />
        ) : (
          <span className='hot-plus'>
            <Icon name='plus' size={18} stroke={accent} />
          </span>
        )}
      </button>
    )
  }

  // zone
  const z = slot.zone
  return (
    <button
      className={'hot hot--zone' + (filled ? ' hot--filled' : ' hot--empty')}
      style={{
        left: (z.x - z.w / 2) * 100 + '%',
        top: (z.y - z.h / 2) * 100 + '%',
        width: z.w * 100 + '%',
        height: z.h * 100 + '%',
        '--acc': accent
      }}
      onClick={onClick}
      aria-label={mod ? slot.name + ': ' + mod.name : slot.name + ' — leer'}
      title={mod ? slot.name + ': ' + mod.name : slot.name}
    >
      {filled ? (
        <GenImage
          className='hot-img'
          prompt={window.NTX.modulePrompt(mod.name)}
          w={160}
          h={160}
          alt={mod.name}
          accent={accent}
        />
      ) : (
        <span className='hot-plus'>
          <Icon name='plus' size={18} stroke={accent} />
        </span>
      )}
      <span className='ntx-mono hot-zonelbl'>{slot.name}</span>
    </button>
  )
}

// ─────────────────────────────────────────────
//  Asset hero card — generated background + slot hotspots
// ─────────────────────────────────────────────
function AssetCard({ section, accent, onSlot }) {
  return (
    <div className='ntx-panel asset-card'>
      <div className='asset-cardhead'>
        <div className='asset-cardhead-left'>
          <h2 className='ntx-title asset-name'>{section.title}</h2>
          <div className='asset-tags'>
            <span className='ntx-chip'>{section.flavor}</span>
            <span className='ntx-chip'>{section.tier}</span>
          </div>
        </div>
        <span className='asset-cond ntx-mono' style={{ '--acc': accent }}>
          {section.condition}%
        </span>
      </div>
      <div className='asset-hero' style={{ aspectRatio: section.heroAspect }}>
        <GenImage
          className='asset-art'
          prompt={section.heroPrompt}
          w={1280}
          h={720}
          alt={section.heroAlt}
          accent={accent}
        />
        {section.conveyor && (
          <div className='conveyor' style={{ '--acc': accent }} />
        )}
        <div className='asset-hero-vignette' />
        {section.slots.map(s => (
          <Hotspot
            key={s.id}
            slot={s}
            layout={section.layout}
            accent={accent}
            onClick={() => onSlot(s)}
          />
        ))}
      </div>
      <div className='asset-gauge-wrap'>
        <ConditionGauge value={section.condition} accent={accent} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
//  Action bar
// ─────────────────────────────────────────────
function ActionBar({ section, accent, onAction }) {
  const needsRepair = section.condition < 50
  return (
    <div className='actionbar'>
      <button
        className={'actionbtn' + (needsRepair ? ' actionbtn--hot' : '')}
        onClick={() => onAction('repair')}
      >
        <Icon name='wrench' size={15} />
        <span className='ntx-mono'>Reparieren</span>
        {needsRepair && <span className='actionbtn-dot' />}
      </button>
      <button className='actionbtn' onClick={() => onAction('upgrade')}>
        <Icon name='up' size={15} />
        <span className='ntx-mono'>Upgrade</span>
      </button>
      <button className='actionbtn' onClick={() => onAction('sell')}>
        <Icon name='tag' size={15} />
        <span className='ntx-mono'>Verkaufen</span>
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
//  Slot row (compact action list — mirrors AssetSlotActionList)
// ─────────────────────────────────────────────
function SlotRow({ slot, accent, onClick }) {
  const mod = slot.installed ? window.NTX.findModule(slot.installed) : null
  return (
    <button
      className={'slotrow' + (mod ? '' : ' slotrow--empty')}
      style={{ '--acc': accent }}
      onClick={onClick}
    >
      <span className='slotrow-thumb'>
        {mod ? (
          <GenImage
            className='slotrow-img'
            prompt={window.NTX.modulePrompt(mod.name)}
            w={120}
            h={120}
            alt={mod.name}
            accent={accent}
          />
        ) : (
          <Icon name='plus' size={20} stroke={accent} />
        )}
      </span>
      <span className='slotrow-body'>
        <span className='ntx-mono slotrow-slot' style={{ color: accent }}>
          {slot.name}
        </span>
        {mod ? (
          <React.Fragment>
            <strong className='slotrow-mod'>{mod.name}</strong>
            <span className='effect-chip' style={{ '--acc': accent }}>
              {mod.desc}
            </span>
          </React.Fragment>
        ) : (
          <span className='ntx-mono slotrow-empty-lbl'>
            Leer · Modul einbauen
          </span>
        )}
      </span>
      <span className='slotrow-chev'>
        <Icon name='down' size={16} stroke={accent} />
      </span>
    </button>
  )
}

// ─────────────────────────────────────────────
//  Rig (slot action list)
// ─────────────────────────────────────────────
function Rig({ section, accent, onSlot }) {
  const filled = section.slots.filter(s => s.installed).length
  return (
    <section className='rig'>
      <div className='rig-head'>
        <h3 className='ntx-title rig-title'>Module</h3>
        <span className='ntx-mono rig-count' style={{ color: accent }}>
          {filled}/{section.slots.length} belegt
        </span>
      </div>
      <div className='rig-list'>
        {section.slots.map(s => (
          <SlotRow
            key={s.id}
            slot={s}
            accent={accent}
            onClick={() => onSlot(s)}
          />
        ))}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
//  Finance panel
// ─────────────────────────────────────────────
function FinancePanel({ accent }) {
  const f = window.NTX.fmtEuro
  const ls = window.NTX.LIABILITIES
  return (
    <section className='ntx-panel finance'>
      <div className='finance-head'>
        <Icon name='coin' size={15} stroke={accent} />
        <h3 className='ntx-title finance-title'>Finanzen</h3>
      </div>
      {ls.length === 0 ? (
        <p className='ntx-mono finance-empty'>
          Keine offenen Verbindlichkeiten
        </p>
      ) : (
        <ul className='liab-list'>
          {ls.map(l => (
            <li key={l.id} className='liab' style={{ '--acc': accent }}>
              <div className='liab-row'>
                <span className='ntx-mono liab-kind'>{l.label}</span>
                <span className='ntx-mono liab-daily'>
                  {f(l.dailyPayment)}/Tag
                </span>
              </div>
              <div className='liab-row liab-row--sub'>
                <span className='ntx-mono liab-sub'>
                  {f(l.principalRemaining)} · {l.termDaysRemaining} Tage
                </span>
                <button
                  className='liab-refi ntx-mono'
                  style={{ '--acc': accent }}
                >
                  Umschulden
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ─────────────────────────────────────────────
//  Empty section (acquire CTA)
// ─────────────────────────────────────────────
function EmptySection({ section, accent, onAcquire }) {
  return (
    <div className='empty-sec'>
      <div className='ntx-panel empty-art-wrap'>
        <GenImage
          className='empty-art'
          prompt={section.heroPrompt}
          w={800}
          h={450}
          alt={section.heroAlt}
          accent={accent}
        />
        <div className='empty-art-grad' />
        <div className='empty-overlay'>
          <span className='ntx-mono empty-tag'>NICHT IM BESITZ</span>
          <h2 className='ntx-title empty-name'>{section.title}</h2>
          <p className='ntx-mono empty-desc'>{section.desc}</p>
        </div>
      </div>
      <button
        className='acquire-cta'
        onClick={onAcquire}
        style={{ '--acc': accent }}
      >
        <Icon name='plus' size={18} />
        <span className='ntx-mono'>
          Anschaffen ab {window.NTX.fmtEuro(section.acquire.priceDiy)}
        </span>
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
//  Bottom tab bar
// ─────────────────────────────────────────────
function TabBar({ active, onSelect }) {
  const NTX = window.NTX
  return (
    <nav className='tabbar'>
      {NTX.SECTION_ORDER.map(key => {
        const s = NTX.SECTIONS[key]
        const isActive = key === active
        return (
          <button
            key={key}
            className={'tab' + (isActive ? ' tab--active' : '')}
            onClick={() => onSelect(key)}
            style={{ '--acc': s.accent }}
            aria-selected={isActive}
          >
            <Icon
              name={s.icon}
              size={20}
              stroke={isActive ? '#0a0a0a' : s.accent}
            />
            <span className='ntx-mono tab-lbl'>{s.tabLabel}</span>
          </button>
        )
      })}
    </nav>
  )
}

Object.assign(window, {
  Icon,
  GenImage,
  ConditionGauge,
  StatusHeader,
  AssetCard,
  ActionBar,
  Hotspot,
  SlotRow,
  Rig,
  FinancePanel,
  EmptySection,
  TabBar,
  NTXContext
})
