import React, { useState, useEffect } from 'react';

// --- SVG DECORATIONS ---

export const HexBorder = ({ className }) => (
  <svg className={className} viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 0H95L100 5V95L95 100H5L0 95V5L5 0Z" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
    <rect x="2" y="2" width="4" height="4" fill="currentColor"/>
    <rect x="94" y="94" width="4" height="4" fill="currentColor"/>
  </svg>
);

export const CrosshairIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2V6M12 18V22M2 12H6M18 12H22M12 12V12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="square"/>
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2"/>
  </svg>
);

export const MoneyIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2V22M8 6H14C16.2091 6 18 7.79086 18 10C18 12.2091 16.2091 14 14 14H10C7.79086 14 6 15.7908 6 18C6 20.2091 7.79086 22 10 22H16" stroke="currentColor" strokeWidth="2" strokeLinecap="square"/>
    <path d="M4 12L6 12M18 12L20 12" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const AlertIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L22 20H2L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"/>
    <rect x="11" y="10" width="2" height="6" fill="currentColor"/>
    <rect x="11" y="17" width="2" height="2" fill="currentColor"/>
  </svg>
);

// --- UI COMPONENTS ---

// 1. Industrial Toggle
export const BrutalToggle = ({ label, initialState = false }) => {
  const [isOn, setIsOn] = useState(initialState);
  const [isGlitching, setIsGlitching] = useState(false);

  const toggle = () => {
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 150);
    setIsOn(!isOn);
  };

  return (
    <div className="flex items-center justify-between w-full max-w-sm border border-[#39FF14]/30 p-3 bg-black">
      <span className="text-sm font-bold tracking-widest uppercase">{label}</span>
      <button
        onClick={toggle}
        className={`relative w-16 h-8 border-2 border-[#39FF14] flex items-center p-1 transition-colors duration-75 ${isGlitching ? 'translate-x-[1px] translate-y-[1px]' : ''}`}
        aria-pressed={isOn}
      >
        <div className={`w-full h-full absolute inset-0 bg-[#39FF14] transition-opacity duration-150 ${isOn ? 'opacity-20' : 'opacity-0'}`}></div>
        <div className={`w-5 h-full bg-[#39FF14] transition-transform duration-100 z-10 ${isOn ? 'translate-x-8' : 'translate-x-0'}`}>
           <div className="w-[2px] h-full bg-black mx-auto opacity-50"></div>
        </div>
        <span className={`absolute text-[10px] font-bold z-0 ${isOn ? 'left-2 text-[#39FF14]' : 'right-2 text-[#39FF14]/50'}`}>
          {isOn ? 'ON' : 'OFF'}
        </span>
      </button>
    </div>
  );
};

// 2. Segmented Block Meter
export const BlockMeter = ({ label, value, max = 10, isDanger = false }) => {
  const blocks = Array.from({ length: max }, (_, i) => i);
  return (
    <div className="w-full max-w-sm flex flex-col gap-2">
      <div className="flex justify-between items-end">
        <span className="text-xs tracking-widest uppercase opacity-80">{label}</span>
        <span className={`text-sm font-bold ${isDanger && value > max * 0.8 ? 'text-white animate-pulse' : 'text-[#39FF14]'}`}>
          {value} / {max}
        </span>
      </div>
      <div className="flex gap-1 h-6">
        {blocks.map(block => {
          const isFilled = block < value;
          const isCritical = isDanger && block >= max * 0.8;
          let blockClass = "flex-1 border border-[#39FF14]/30 transition-all duration-300";
          if (isFilled) {
            blockClass = isCritical
              ? "flex-1 bg-white border-white animate-pulse shadow-[0_0_10px_#fff]"
              : "flex-1 bg-[#39FF14] border-[#39FF14] shadow-[0_0_5px_rgba(57,255,20,0.5)]";
          }
          return <div key={block} className={blockClass}></div>;
        })}
      </div>
    </div>
  );
};

// 3. Brutalist Tabs
export const BrutalTabs = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const tabs = [
    { id: 'inventory', label: 'INVENTORY' },
    { id: 'upgrades', label: 'UPGRADES' }
  ];

  return (
    <div className="w-full max-w-sm border border-[#39FF14]/50 p-1">
      <div role="tablist" aria-label="HQ Navigation" className="flex border-b-2 border-[#39FF14]">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 text-xs font-bold tracking-[0.1em] uppercase transition-all
                ${isActive ? 'bg-[#39FF14] text-black shadow-[0_-2px_10px_rgba(57,255,20,0.3)]' : 'bg-black text-[#39FF14] hover:bg-[#39FF14]/10'}`}
            >
              {isActive && <span className="mr-2">▶</span>}
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="p-4 bg-[#050505] min-h-[100px] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#39FF14 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
        {tabs.map(tab => (
          <div key={`panel-${tab.id}`} className={activeTab === tab.id ? 'block relative z-10' : 'hidden'}>
            <p className="text-sm opacity-80 typewriter-effect">Loading {tab.label} module...</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// 4. Data/Stat Block
export const StatBlock = ({ label, value, icon: Icon }) => (
  <div className="relative w-32 h-24 bg-black flex flex-col items-center justify-center group overflow-hidden">
    <HexBorder className="absolute inset-0 w-full h-full text-[#39FF14]/50 group-hover:text-[#39FF14] transition-colors" />
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#39FF14]/10 to-transparent translate-y-[-100%] group-hover:animate-[scan_2s_linear_infinite]"></div>
    <div className="z-10 flex flex-col items-center gap-1">
      {Icon && <Icon className="w-5 h-5 text-[#39FF14]" />}
      <span className="text-2xl font-bold tracking-wider">{value}</span>
      <span className="text-[9px] tracking-[0.2em] opacity-60 uppercase">{label}</span>
    </div>
  </div>
);

// 5. Brutal Amp Fader (Custom Slider)
export const BrutalFader = ({ label, initialValue = 7, max = 10 }) => {
  const [val, setVal] = useState(initialValue);
  const segments = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <div className="w-full max-w-sm flex flex-col gap-2">
       <div className="flex justify-between items-end">
        <span className="text-xs tracking-widest uppercase opacity-80">{label}</span>
        <span className="text-sm font-bold text-[#39FF14]">{val}</span>
      </div>
      <div className="flex gap-1 h-8 items-end cursor-pointer group" onMouseLeave={() => {}}>
        {segments.map(segment => {
          const isActive = segment <= val;
          // Calculate dynamic height for the bars to look like an EQ/Volume fader
          const height = `${30 + (segment / max) * 70}%`;
          return (
            <div
              key={segment}
              onClick={() => setVal(segment)}
              className="flex-1 relative h-full flex items-end group-hover:opacity-100"
            >
              <div
                style={{ height }}
                className={`w-full transition-colors duration-75 border-b-2 border-transparent hover:border-white
                  ${isActive ? 'bg-[#39FF14] shadow-[0_0_8px_rgba(57,255,20,0.4)]' : 'bg-[#39FF14]/20'}`}
              ></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 6. Setlist / Track Selector
export const SetlistSelector = () => {
  const [selected, setSelected] = useState(1);
  const tracks = [
    { id: 1, name: "SUICIDAL JESUS", difficulty: "HARD" },
    { id: 2, name: "SYSTEMSPRENGER", difficulty: "EXPERT" },
    { id: 3, name: "TRAVESTIE MASSAKER", difficulty: "INSANE" },
  ];

  return (
    <div className="w-full max-w-sm flex flex-col gap-3">
      {tracks.map(track => {
        const isSelected = selected === track.id;
        return (
          <button
            key={track.id}
            onClick={() => setSelected(track.id)}
            className={`w-full text-left p-3 border-2 transition-all duration-100 flex justify-between items-center group
              ${isSelected ? 'border-[#39FF14] bg-[#39FF14]/10 shadow-[inset_0_0_15px_rgba(57,255,20,0.2)]' : 'border-[#39FF14]/30 bg-black hover:border-[#39FF14]/70'}`}
          >
            <div className="flex items-center gap-3">
              <span className={`text-xl font-bold ${isSelected ? 'text-[#39FF14]' : 'text-[#39FF14]/30'}`}>
                {isSelected ? '[X]' : '[ ]'}
              </span>
              <span className={`font-bold tracking-widest uppercase ${isSelected ? 'text-white' : 'text-[#39FF14]/80'}`}>
                {track.name}
              </span>
            </div>
            <span className={`text-[10px] tracking-widest px-2 py-1 border ${isSelected ? 'border-[#39FF14] text-[#39FF14]' : 'border-transparent text-[#39FF14]/50'}`}>
              {track.difficulty}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// 7. Crisis Modal Overlay
export const CrisisModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      {/* Scanline FX on background */}
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.5) 50%)', backgroundSize: '100% 4px' }}></div>

      {/* Modal Box */}
      <div className="relative w-full max-w-lg border-2 border-[#39FF14] bg-black shadow-[0_0_40px_rgba(57,255,20,0.3)] animate-[glitch-anim_0.2s_ease-in-out]">
        {/* Hardware details */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[#39FF14]"></div>
        <div className="absolute top-0 left-2 w-16 h-4 bg-[#39FF14] text-black text-[10px] font-bold text-center leading-4">CRITICAL</div>

        <div className="p-8 flex flex-col gap-6">
          <div className="flex items-start gap-4 border-b border-[#39FF14]/30 pb-6">
            <AlertIcon className="w-12 h-12 text-[#39FF14] animate-pulse shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold tracking-[0.1em] uppercase glitch-text">Van Breakdown</h2>
              <p className="mt-2 text-sm opacity-80 leading-relaxed">
                The transmission just dropped halfway to Leipzig. You have a gig in 4 hours. Do you burn through your cash for a sketchy mechanic, or risk showing up late and losing face?
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={onClose} className="w-full p-3 border border-[#39FF14] bg-[#39FF14]/10 hover:bg-[#39FF14] hover:text-black font-bold tracking-widest uppercase transition-colors text-left flex justify-between">
              <span>Pay mechanic (-$250)</span>
              <span className="opacity-50 text-xs mt-1">SAFE</span>
            </button>
            <button onClick={onClose} className="w-full p-3 border border-white/50 text-white/50 hover:border-white hover:text-white hover:bg-white/10 font-bold tracking-widest uppercase transition-colors text-left flex justify-between">
              <span>Fix it yourselves (+1hr)</span>
              <span className="opacity-50 text-xs mt-1">RISKY</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
// Re-export as default for rendering as a scene if needed

export default function App() {
  const [overload, setOverload] = useState(3);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setOverload(prev => (prev >= 10 ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-[#39FF14] font-mono p-4 sm:p-8 flex flex-col items-center overflow-x-hidden">

      <header className="w-full max-w-5xl border-b border-[#39FF14]/30 pb-4 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-[0.2em] uppercase glitch-text">UI_PATTERNS</h1>
          <p className="text-xs opacity-60 uppercase tracking-widest mt-1">Component Library v2.0 // Void Worship</p>
        </div>
        <div className="text-[10px] border border-[#39FF14] px-2 py-1 animate-pulse hidden sm:block">STATUS: ONLINE</div>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-x-12 gap-y-12">

        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-12">
          <section className="flex flex-col gap-6">
            <h2 className="text-xs tracking-widest opacity-50 border-b border-[#39FF14]/20 pb-1">01 // TOGGLES</h2>
            <BrutalToggle label="Auto-Distortion" initialState={true} />
            <BrutalToggle label="Safe Mode" initialState={false} />
          </section>

          <section className="flex flex-col gap-6">
            <h2 className="text-xs tracking-widest opacity-50 border-b border-[#39FF14]/20 pb-1">02 // AMP_FADERS</h2>
            <BrutalFader label="Master Volume" initialValue={8} />
            <BrutalFader label="Crowd Noise" initialValue={4} />
          </section>
        </div>

        {/* MIDDLE COLUMN */}
        <div className="flex flex-col gap-12">
          <section className="flex flex-col gap-6">
            <h2 className="text-xs tracking-widest opacity-50 border-b border-[#39FF14]/20 pb-1">03 // BLOCK_METERS</h2>
            <BlockMeter label="Amp Overload" value={overload} max={10} isDanger={true} />
            <BlockMeter label="Band Harmony" value={4} max={10} isDanger={false} />
          </section>

          <section className="flex flex-col gap-6">
            <h2 className="text-xs tracking-widest opacity-50 border-b border-[#39FF14]/20 pb-1">04 // TRACK_SELECT</h2>
            <SetlistSelector />
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-12">
          <section className="flex flex-col gap-6">
            <h2 className="text-xs tracking-widest opacity-50 border-b border-[#39FF14]/20 pb-1">05 // DATA_BLOCKS</h2>
            <div className="flex gap-4 flex-wrap">
              <StatBlock label="Fame" value="4.2K" icon={CrosshairIcon} />
              <StatBlock label="Vault" value="$840" icon={MoneyIcon} />
            </div>
          </section>

          <section className="flex flex-col gap-6">
            <h2 className="text-xs tracking-widest opacity-50 border-b border-[#39FF14]/20 pb-1">06 // CRISIS_SYSTEM</h2>
            <div className="p-4 border border-[#39FF14]/30 bg-[#39FF14]/5">
              <p className="text-xs opacity-80 mb-4 leading-relaxed">
                Crisis events interrupt the flow and require immediate resolution.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="w-full p-3 bg-[#39FF14] text-black font-bold tracking-widest uppercase hover:bg-white hover:shadow-[0_0_20px_#fff] transition-all"
              >
                Trigger Crisis
              </button>
            </div>
          </section>
        </div>

      </main>

      <CrisisModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      {/* Global CSS for custom animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
        .typewriter-effect {
          overflow: hidden;
          white-space: nowrap;
          animation: typing 1s steps(30, end);
        }
        @keyframes typing { from { width: 0 } to { width: 100% } }

        .glitch-text { position: relative; }
        .glitch-text::before, .glitch-text::after {
          content: attr(data-text); /* Fallback */
          position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: black;
        }
        .glitch-text::before {
          content: 'UI_PATTERNS';
          left: 2px; text-shadow: -1px 0 red; clip: rect(24px, 550px, 90px, 0);
          animation: glitch-anim-2 3s infinite linear alternate-reverse;
        }
        .glitch-text::after {
          content: 'UI_PATTERNS';
          left: -2px; text-shadow: -1px 0 blue; clip: rect(85px, 550px, 140px, 0);
          animation: glitch-anim 2.5s infinite linear alternate-reverse;
        }
        /* Specific override for the crisis modal title */
        .glitch-text.text-2xl::before, .glitch-text.text-2xl::after { content: 'Van Breakdown'; }

        @keyframes glitch-anim {
          0% { clip: rect(4px, 999px, 80px, 0); }
          20% { clip: rect(100px, 999px, 140px, 0); }
          40% { clip: rect(41px, 999px, 84px, 0); }
          60% { clip: rect(6px, 999px, 52px, 0); }
          80% { clip: rect(80px, 999px, 120px, 0); }
          100% { clip: rect(12px, 999px, 59px, 0); }
        }
        @keyframes glitch-anim-2 {
          0% { clip: rect(65px, 999px, 100px, 0); }
          20% { clip: rect(3px, 999px, 40px, 0); }
          40% { clip: rect(80px, 999px, 120px, 0); }
          60% { clip: rect(22px, 999px, 60px, 0); }
          80% { clip: rect(100px, 999px, 140px, 0); }
          100% { clip: rect(45px, 999px, 80px, 0); }
        }
      `}} />
    </div>
  );
}
