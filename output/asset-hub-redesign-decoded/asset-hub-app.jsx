/* global React, NTXContext, StatusHeader, AssetCard, ActionBar, Rig, FinancePanel,
   EmptySection, TabBar, GenImage, Icon,
   useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakToggle, TweakSlider */
const { useState, useEffect } = React

// ─────────────────────────────────────────────
//  Bottom sheet shell
// ─────────────────────────────────────────────
function Sheet({ title, accent, onClose, children }) {
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className='sheet-backdrop' onClick={onClose}>
      <div
        className='sheet'
        style={{ '--acc': accent }}
        onClick={e => e.stopPropagation()}
      >
        <div className='sheet-grip' />
        <div className='sheet-head'>
          <h3 className='ntx-title sheet-title'>{title}</h3>
          <button className='sheet-x' onClick={onClose} aria-label='Schließen'>
            <Icon name='x' size={18} />
          </button>
        </div>
        <div className='sheet-body'>{children}</div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
//  Module picker sheet
// ─────────────────────────────────────────────
function ModuleSheet({ slot, accent, onClose, onToast }) {
  const NTX = window.NTX
  const pool = NTX.POOLS[slot.slotType] || []
  const installed = slot.installed ? NTX.findModule(slot.installed) : null
  const cash = NTX.STATUS.cash

  return (
    <Sheet
      title={installed ? 'Slot verwalten' : 'Modul wählen'}
      accent={accent}
      onClose={onClose}
    >
      <div className='sheet-slotlabel ntx-mono' style={{ color: accent }}>
        {slot.name}
      </div>

      {installed && (
        <div
          className='mod-card mod-card--installed'
          style={{ '--acc': accent }}
        >
          <GenImage
            className='mod-thumb'
            prompt={NTX.modulePrompt(installed.name)}
            w={200}
            h={200}
            alt={installed.name}
            accent={accent}
          />
          <div className='mod-info'>
            <span className='ntx-mono mod-state' style={{ color: accent }}>
              EINGEBAUT
            </span>
            <strong className='mod-name'>{installed.name}</strong>
            <span className='effect-chip' style={{ '--acc': accent }}>
              {installed.desc}
            </span>
            <button
              className='mod-btn mod-btn--ghost ntx-mono'
              style={{ '--acc': accent }}
              onClick={() => {
                onToast(installed.name + ' ausgebaut')
                onClose()
              }}
            >
              Ausbauen · +{NTX.fmtEuro(Math.round(installed.cost * 0.4))}
            </button>
          </div>
        </div>
      )}

      {!installed && (
        <div className='mod-grid'>
          {pool.length === 0 && (
            <p className='ntx-mono sheet-empty'>
              Keine Module für diesen Slot.
            </p>
          )}
          {pool.map(m => {
            const locked = !!m.lock
            const broke = cash < m.cost
            const blocked = locked || broke
            return (
              <div
                key={m.id}
                className={'mod-card' + (blocked ? ' mod-card--blocked' : '')}
                style={{ '--acc': accent }}
              >
                <GenImage
                  className='mod-thumb'
                  prompt={NTX.modulePrompt(m.name)}
                  w={200}
                  h={200}
                  alt={m.name}
                  accent={accent}
                />
                <div className='mod-info'>
                  <strong className='mod-name'>{m.name}</strong>
                  <span className='effect-chip' style={{ '--acc': accent }}>
                    {m.desc}
                  </span>
                  <div className='mod-foot'>
                    <span className='ntx-mono mod-cost'>
                      {m.cost === 0 ? 'GRATIS' : NTX.fmtEuro(m.cost)}
                    </span>
                    <button
                      className='mod-btn ntx-mono'
                      style={{ '--acc': accent }}
                      disabled={blocked}
                      onClick={() => {
                        onToast(m.name + ' eingebaut')
                        onClose()
                      }}
                    >
                      Einbauen
                    </button>
                  </div>
                  {locked && (
                    <span className='mod-lock ntx-mono'>{m.lock}</span>
                  )}
                  {!locked && broke && (
                    <span className='mod-lock ntx-mono'>Nicht genug Geld</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Sheet>
  )
}

// ─────────────────────────────────────────────
//  Acquire sheet
// ─────────────────────────────────────────────
function Seg({ options, value, onChange, accent }) {
  return (
    <div className='seg' style={{ '--acc': accent }}>
      {options.map(o => (
        <button
          key={o.v}
          className={'seg-btn ntx-mono' + (o.v === value ? ' seg-btn--on' : '')}
          disabled={o.disabled}
          onClick={() => onChange(o.v)}
        >
          {o.l}
        </button>
      ))}
    </div>
  )
}

function AcquireSheet({ section, accent, onClose, onToast }) {
  const NTX = window.NTX
  const [flavor, setFlavor] = useState('diy')
  const [tier, setTier] = useState(1)
  const [mode, setMode] = useState('cash')
  const base =
    flavor === 'legit' ? section.acquire.priceLegit : section.acquire.priceDiy
  const price = Math.round(base * (1 + (tier - 1) * 0.6))
  const diyLoan = flavor === 'diy' && mode === 'loan'
  const insufficient = mode === 'cash' && NTX.STATUS.cash < price

  return (
    <Sheet title='Anschaffen' accent={accent} onClose={onClose}>
      <GenImage
        className='acq-art'
        prompt={section.heroPrompt}
        w={800}
        h={450}
        alt={section.heroAlt}
        accent={accent}
      />
      <div className='acq-row'>
        <span className='ntx-mono acq-lbl'>Variante</span>
        <Seg
          accent={accent}
          value={flavor}
          onChange={setFlavor}
          options={[
            { v: 'legit', l: 'Legit' },
            { v: 'diy', l: 'DIY' }
          ]}
        />
      </div>
      <div className='acq-row'>
        <span className='ntx-mono acq-lbl'>Tier</span>
        <Seg
          accent={accent}
          value={tier}
          onChange={setTier}
          options={[
            { v: 1, l: 'I' },
            { v: 2, l: 'II' },
            { v: 3, l: 'III' }
          ]}
        />
      </div>
      <div className='acq-row'>
        <span className='ntx-mono acq-lbl'>Modus</span>
        <Seg
          accent={accent}
          value={mode}
          onChange={setMode}
          options={[
            { v: 'cash', l: 'Cash' },
            { v: 'loan', l: 'Kredit', disabled: flavor === 'diy' },
            { v: 'crowdfund', l: 'Crowdfund' }
          ]}
        />
      </div>
      {diyLoan && (
        <p className='acq-warn ntx-mono'>
          DIY-Chassis kann nicht über Kredit finanziert werden.
        </p>
      )}
      {insufficient && <p className='acq-warn ntx-mono'>Nicht genug Geld.</p>}
      <div className='acq-foot' style={{ '--acc': accent }}>
        <span className='ntx-title acq-price'>{NTX.fmtEuro(price)}</span>
        <button
          className='acq-buy ntx-mono'
          disabled={insufficient}
          onClick={() => {
            onToast(section.title + ' angeschafft')
            onClose()
          }}
        >
          Kaufen
        </button>
      </div>
    </Sheet>
  )
}

// ─────────────────────────────────────────────
//  Tweak defaults
// ─────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/ {
  atmosphere: 'dezent',
  art: true,
  density: 'komfort',
  glow: 55
} /*EDITMODE-END*/

// ─────────────────────────────────────────────
//  App
// ─────────────────────────────────────────────
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS)
  const [active, setActive] = useState('tourbus_chassis')
  const [sheet, setSheet] = useState(null) // {type, slot?}
  const [toast, setToast] = useState(null)

  const NTX = window.NTX
  const section = NTX.SECTIONS[active]
  const accent = section.accent

  const showToast = msg => {
    setToast(msg)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(null), 1900)
  }

  const onAction = kind => {
    const map = {
      repair: 'Reparatur eingeleitet',
      upgrade: 'Upgrade gewählt',
      sell: 'Verkauf vorgemerkt'
    }
    showToast(map[kind])
  }

  // atmosphere overlay opacity
  const atmoOpacity =
    t.atmosphere === 'voll' ? 1 : t.atmosphere === 'dezent' ? 0.4 : 0
  const glow = (t.glow ?? 55) / 100

  const rootStyle = {
    '--acc': accent,
    '--glow': glow,
    '--atmo': atmoOpacity
  }

  return (
    <NTXContext.Provider value={{ artOn: t.art !== false }}>
      <div className='stage'>
        <div
          className={'phone density-' + (t.density || 'komfort')}
          style={rootStyle}
        >
          {/* atmosphere overlays */}
          <div className='atmo atmo-scan' />
          <div className='atmo atmo-grain' />

          <div className='screen'>
            <StatusHeader accent={accent} />

            <div className='scroll' key={active}>
              {section.owned ? (
                <React.Fragment>
                  <AssetCard
                    section={section}
                    accent={accent}
                    onSlot={slot => setSheet({ type: 'module', slot })}
                  />
                  <ActionBar
                    section={section}
                    accent={accent}
                    onAction={onAction}
                  />
                  <Rig
                    section={section}
                    accent={accent}
                    onSlot={slot => setSheet({ type: 'module', slot })}
                  />
                  <FinancePanel accent={accent} />
                  <div className='scroll-pad' />
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <EmptySection
                    section={section}
                    accent={accent}
                    onAcquire={() => setSheet({ type: 'acquire' })}
                  />
                  <FinancePanel accent={accent} />
                  <div className='scroll-pad' />
                </React.Fragment>
              )}
            </div>

            <TabBar active={active} onSelect={setActive} />
          </div>

          {/* Toast */}
          {toast && (
            <div className='toast ntx-mono' style={{ '--acc': accent }}>
              <span className='toast-dot' />
              {toast}
            </div>
          )}

          {/* Sheets */}
          {sheet?.type === 'module' && (
            <ModuleSheet
              slot={sheet.slot}
              accent={accent}
              onClose={() => setSheet(null)}
              onToast={showToast}
            />
          )}
          {sheet?.type === 'acquire' && (
            <AcquireSheet
              section={section}
              accent={accent}
              onClose={() => setSheet(null)}
              onToast={showToast}
            />
          )}
        </div>
      </div>

      <TweaksPanel>
        <TweakSection label='Atmosphäre' />
        <TweakRadio
          label='FX-Stärke'
          value={t.atmosphere}
          options={['aus', 'dezent', 'voll']}
          onChange={v => setTweak('atmosphere', v)}
        />
        <TweakSlider
          label='Akzent-Glow'
          value={t.glow}
          min={0}
          max={100}
          unit='%'
          onChange={v => setTweak('glow', v)}
        />
        <TweakSection label='Inhalt' />
        <TweakToggle
          label='Generierte Grafik'
          value={t.art}
          onChange={v => setTweak('art', v)}
        />
        <TweakRadio
          label='Dichte'
          value={t.density}
          options={['komfort', 'kompakt']}
          onChange={v => setTweak('density', v)}
        />
      </TweaksPanel>
    </NTXContext.Provider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
