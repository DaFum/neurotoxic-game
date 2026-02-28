import React, { useState, useEffect, useRef } from 'react';

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

export const SkullIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 7C5 4 8 2 12 2C16 2 19 4 19 7V13C19 16 16 17 16 17L15 22H9L8 17C8 17 5 16 5 13V7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter"/>
    <circle cx="9" cy="10" r="1" fill="currentColor" stroke="currentColor" strokeWidth="1"/>
    <circle cx="15" cy="10" r="1" fill="currentColor" stroke="currentColor" strokeWidth="1"/>
    <path d="M10 16H14" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const GearIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M19.4 15A1.65 1.65 0 0 0 19 16.5L20 18L18 20L16.5 19A1.65 1.65 0 0 0 15 19.4V21H12H9V19.4A1.65 1.65 0 0 0 7.5 19L6 20L4 18L5 16.5A1.65 1.65 0 0 0 4.6 15H3V12V9H4.6A1.65 1.65 0 0 0 5 7.5L4 6L6 4L7.5 5A1.65 1.65 0 0 0 9 4.6V3H12H15V4.6A1.65 1.65 0 0 0 16.5 5L18 4L20 6L19 7.5A1.65 1.65 0 0 0 19.4 9H21V12V15H19.4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter"/>
  </svg>
);

export const HexNode = ({ className }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 5L95 25V75L50 95L5 75V25L50 5Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="miter"/>
    <circle cx="50" cy="50" r="10" fill="currentColor"/>
    <path d="M50 25V40M50 60V75M25 50H40M60 50H75" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const WarningStripe = () => (
  <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="stripes" width="20" height="20" patternTransform="rotate(45)">
        <rect width="10" height="20" fill="#39FF14"/>
        <rect x="10" width="10" height="20" fill="black"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#stripes)"/>
  </svg>
);

export const BiohazardIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 14.5C13.3807 14.5 14.5 13.3807 14.5 12C14.5 10.6193 13.3807 9.5 12 9.5C10.6193 9.5 9.5 10.6193 9.5 12C9.5 13.3807 10.6193 14.5 12 14.5Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 9.5V4M12 4C9.5 4 7.5 5.5 6.5 7.5M12 4C14.5 4 16.5 5.5 17.5 7.5M9.83494 13.25L5.0718 16M5.0718 16C3.5 14.5 3 12 3.5 9.5M5.0718 16C6.5 17.5 9 18 11.5 17.5M14.1651 13.25L18.9282 16M18.9282 16C20.5 14.5 21 12 20.5 9.5M18.9282 16C17.5 17.5 15 18 12.5 17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="square"/>
  </svg>
);

export const CorporateSeal = ({ className }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="4" strokeDasharray="10 5"/>
    <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="2"/>
    <path d="M30 50L45 65L75 35" stroke="currentColor" strokeWidth="6" strokeLinecap="square"/>
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

// 8. Deadman Button (Hold to Confirm)
export const DeadmanButton = ({ label, onConfirm }) => {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const intervalRef = useRef(null);

  const startHold = () => {
    if (progress >= 100) return;
    setIsHolding(true);
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(intervalRef.current);
          setIsHolding(false);
          if (onConfirm) onConfirm();
          return 100;
        }
        return prev + 2; // Speed of fill
      });
    }, 20); // 20ms tick
  };

  const stopHold = () => {
    clearInterval(intervalRef.current);
    setIsHolding(false);
    if (progress < 100) {
      // Rapid drain if let go too early
      const drainInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev <= 0) {
            clearInterval(drainInterval);
            return 0;
          }
          return prev - 5;
        });
      }, 20);
    }
  };

  const isComplete = progress >= 100;

  return (
    <div className="w-full flex flex-col gap-1">
      <span className="text-[10px] tracking-widest uppercase opacity-50 text-center">HOLD TO OVERRIDE</span>
      <button
        onMouseDown={startHold}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        onTouchStart={startHold}
        onTouchEnd={stopHold}
        className={`relative w-full h-14 border-2 overflow-hidden flex items-center justify-center select-none transition-colors
          ${isComplete ? 'border-red-500 bg-red-500/20' : 'border-[#39FF14] bg-black hover:border-white'}`}
      >
        {/* Progress Fill Background */}
        <div
          className={`absolute left-0 top-0 h-full transition-none ${isComplete ? 'bg-red-500' : 'bg-[#39FF14]'}`}
          style={{ width: `${progress}%` }}
        ></div>

        {/* Scanline FX on fill */}
        {isHolding && !isComplete && (
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9zdmc+')] opacity-50 z-10 pointer-events-none"></div>
        )}

        {/* Text */}
        <span className={`relative z-20 font-bold tracking-[0.2em] uppercase mix-blend-difference
          ${isComplete ? 'text-black' : 'text-[#39FF14]'}`}>
          {isComplete ? 'EXECUTED' : label}
        </span>
      </button>
    </div>
  );
};

// 9. Terminal Readout (Log)
export const TerminalReadout = () => {
  const fullLog = [
    "> INITIALIZING VOID_ENGINE v3.0...",
    "> CONNECTING TO STAGE RIG...",
    "[OK] AUDIO CONTEXT STARTED",
    "[WARN] AMP 3 OVERHEATING",
    "> LOADING VENUE: 'THE SLAUGHTERHOUSE'",
    "...",
    "[ERROR] BAND HARMONY CRITICAL.",
    "> AWAITING INPUT_"
  ];

  const [lines, setLines] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < fullLog.length) {
      const timer = setTimeout(() => {
        setLines(prev => [...prev, fullLog[currentIndex]]);
        setCurrentIndex(currentIndex + 1);
      }, Math.random() * 400 + 200); // Random typing delay
      return () => clearTimeout(timer);
    }
  }, [currentIndex, fullLog]);

  return (
    <div className="w-full h-48 border border-[#39FF14]/30 bg-[#050505] p-4 font-mono text-xs overflow-y-auto flex flex-col gap-1 custom-scrollbar relative shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(transparent_50%,rgba(57,255,20,0.2)_50%)] bg-[length:100%_4px]"></div>

      {lines.map((line, i) => (
        <div key={i} className={`${line.includes('[ERROR]') ? 'text-red-500 font-bold' : line.includes('[WARN]') ? 'text-yellow-400' : 'text-[#39FF14]'} opacity-90 leading-relaxed`}>
          {line}
        </div>
      ))}
      {currentIndex < fullLog.length && (
        <div className="w-2 h-3 bg-[#39FF14] animate-pulse mt-1"></div>
      )}
    </div>
  );
};

// 10. Hardware Inventory Slot
export const BrutalSlot = ({ label, item = null }) => {
  return (
    <div className="flex flex-col gap-2 items-center">
      <div className="relative w-20 h-20 border-2 border-[#39FF14]/30 bg-[#0a0a0a] flex items-center justify-center group cursor-pointer hover:border-[#39FF14] transition-colors">
        {/* Corner Decals */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#39FF14] opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#39FF14] opacity-0 group-hover:opacity-100 transition-opacity"></div>

        {item ? (
          <>
            <div className="absolute inset-0 bg-[#39FF14]/10 group-hover:bg-[#39FF14]/20 transition-colors"></div>
            {item.icon}
          </>
        ) : (
          <CrosshairIcon className="w-6 h-6 text-[#39FF14] opacity-20 group-hover:opacity-50 transition-opacity" />
        )}
      </div>
      <span className="text-[9px] tracking-[0.2em] uppercase opacity-60 text-center max-w-[80px] truncate">
        {item ? item.name : label}
      </span>
    </div>
  );
};

// 11. Void Loader (Geometric Spinner)
export const VoidLoader = ({ size = "w-16 h-16" }) => {
  return (
    <div className={`relative ${size} flex items-center justify-center`}>
      {/* Outer Hex - Slow counter-clockwise */}
      <svg className="absolute inset-0 w-full h-full text-[#39FF14] animate-[spin_4s_linear_infinite_reverse]" viewBox="0 0 100 100" fill="none">
        <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" stroke="currentColor" strokeWidth="2" strokeDasharray="10 20" />
      </svg>
      {/* Inner Square - Fast clockwise */}
      <svg className="absolute w-[60%] h-[60%] text-[#39FF14] animate-[spin_1.5s_linear_infinite]" viewBox="0 0 100 100" fill="none">
        <rect x="15" y="15" width="70" height="70" stroke="currentColor" strokeWidth="4" strokeDasharray="40 10" />
      </svg>
      {/* Core Dot - Pulsing */}
      <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_#fff]"></div>
    </div>
  );
};

// 12. Void Nav-Node (Overworld Navigation Target)
export const VoidNavNode = ({ id, label, type, isUnlocked = true, status = 'IDLE' }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative w-40 h-48 flex flex-col items-center justify-center cursor-pointer group ${!isUnlocked ? 'opacity-30' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Target Crosshairs (appear on hover) */}
      <div className={`absolute inset-0 border border-[#39FF14]/30 transition-all duration-300 ${isHovered ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
        <div className="absolute top-0 left-1/2 w-[1px] h-4 bg-[#39FF14] -translate-x-1/2 -translate-y-2"></div>
        <div className="absolute bottom-0 left-1/2 w-[1px] h-4 bg-[#39FF14] -translate-x-1/2 translate-y-2"></div>
        <div className="absolute left-0 top-1/2 w-4 h-[1px] bg-[#39FF14] -translate-y-1/2 -translate-x-2"></div>
        <div className="absolute right-0 top-1/2 w-4 h-[1px] bg-[#39FF14] -translate-y-1/2 translate-x-2"></div>
      </div>

      <HexNode className={`w-20 h-20 transition-all duration-200 ${isHovered ? 'text-white drop-shadow-[0_0_15px_rgba(57,255,20,0.8)]' : 'text-[#39FF14]'}`} />

      {/* Node Info */}
      <div className="mt-4 flex flex-col items-center">
        <span className="text-[10px] opacity-70 tracking-[0.3em] uppercase">{type}</span>
        <span className={`text-sm font-bold tracking-widest uppercase mt-1 ${isHovered ? 'text-white' : 'text-[#39FF14]'}`}>
          {label}
        </span>
      </div>

      {/* Floating Status Tag */}
      {status !== 'IDLE' && (
        <div className="absolute top-2 right-2 bg-[#39FF14] text-black text-[8px] font-bold px-1 tracking-widest animate-pulse">
          {status}
        </div>
      )}
    </div>
  );
};

// 13. Corrupted Data Stream (Text Reveal Effect)
export const CorruptedText = ({ text, delay = 0 }) => {
  const [displayedText, setDisplayedText] = useState("");
  const chars = "!<>-_\\/[]{}—=+*^?#________";

  useEffect(() => {
    let iteration = 0;
    let interval = null;

    const startEffect = () => {
      interval = setInterval(() => {
        setDisplayedText(text.split("").map((char, index) => {
          if (index < iteration) {
            return char;
          }
          return chars[Math.floor(Math.random() * chars.length)];
        }).join(""));

        if (iteration >= text.length) {
          clearInterval(interval);
        }

        iteration += 1 / 3; // Speed of reveal
      }, 30);
    };

    const timeout = setTimeout(startEffect, delay);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [text, delay]);

  return (
    <span className="font-mono">{displayedText}</span>
  );
};

// 14. Hazard Ticker Tape (For Gig Modifiers)
export const HazardTicker = ({ message }) => {
  return (
    <div className="relative w-full h-8 bg-black border-y-2 border-[#39FF14] flex items-center overflow-hidden">
      {/* Striped Background Ends */}
      <div className="absolute left-0 top-0 bottom-0 w-8 z-10"><WarningStripe /></div>
      <div className="absolute right-0 top-0 bottom-0 w-8 z-10"><WarningStripe /></div>

      {/* Scrolling Text Container */}
      <div className="flex w-full whitespace-nowrap animate-[marquee_10s_linear_infinite] px-8 items-center gap-12">
        <span className="text-xs font-bold tracking-[0.3em] uppercase text-[#39FF14]">
          [MODIFIER ACTIVE] {message}
        </span>
        <span className="text-xs font-bold tracking-[0.3em] uppercase text-[#39FF14]">
          [MODIFIER ACTIVE] {message}
        </span>
        <span className="text-xs font-bold tracking-[0.3em] uppercase text-[#39FF14]">
          [MODIFIER ACTIVE] {message}
        </span>
      </div>
    </div>
  );
};

// 15. Industrial Checklist (Pre-Gig Setup)
export const IndustrialChecklist = () => {
  const [tasks, setTasks] = useState([
    { id: 1, label: "REFUEL TOURVAN", completed: false },
    { id: 2, label: "EQUIP DISTORTION PEDAL", completed: false },
    { id: 3, label: "BRIBE VENUE BOUNCER", completed: false },
    { id: 4, label: "CALIBRATE AMPS", completed: false }
  ]);

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const allDone = tasks.every(t => t.completed);

  return (
    <div className="w-full border border-[#39FF14]/30 bg-black p-4 flex flex-col gap-3 relative">
      <div className="text-[10px] opacity-50 tracking-[0.3em] mb-2">PRE-GIG SEQUENCE</div>

      {tasks.map(task => (
        <button
          key={task.id}
          onClick={() => toggleTask(task.id)}
          className={`relative w-full text-left p-3 border transition-all duration-200 flex items-center gap-4 group
            ${task.completed ? 'border-transparent opacity-60' : 'border-[#39FF14]/30 hover:border-[#39FF14] hover:bg-[#39FF14]/10'}`}
        >
          {/* Brutal Checkbox */}
          <div className={`w-5 h-5 border-2 flex items-center justify-center shrink-0 transition-colors
            ${task.completed ? 'border-[#39FF14] bg-[#39FF14]' : 'border-[#39FF14] bg-black'}`}>
            {task.completed && <span className="text-black font-bold text-xs leading-none">X</span>}
          </div>

          <span className={`font-bold tracking-widest uppercase transition-all duration-200
            ${task.completed ? 'text-[#39FF14]' : 'text-[#39FF14]'}`}>
            {task.label}
          </span>

          {/* Strikethrough Line Animation */}
          <div className={`absolute left-10 top-1/2 h-[2px] bg-white transition-all duration-300 ease-out z-10
            ${task.completed ? 'w-[calc(100%-3rem)]' : 'w-0'}`}></div>
        </button>
      ))}

      <button
        disabled={!allDone}
        className={`mt-4 p-4 font-bold tracking-[0.2em] uppercase transition-all duration-300 border-2
          ${allDone ? 'border-[#39FF14] bg-[#39FF14] text-black shadow-[0_0_20px_#39FF14] hover:bg-white hover:border-white animate-pulse' : 'border-[#39FF14]/20 text-[#39FF14]/20 cursor-not-allowed'}`}
      >
        {allDone ? 'INITIATE GIG' : 'AWAITING SEQUENCE'}
      </button>
    </div>
  );
};

// 16. Rhythm Lane Matrix (Simulation of the Rhythm Engine)
export const RhythmMatrix = () => {
  const [hits, setHits] = useState([false, false, false]);

  const triggerHit = (index) => {
    const newHits = [...hits];
    newHits[index] = true;
    setHits(newHits);
    setTimeout(() => {
      const resetHits = [...hits];
      resetHits[index] = false;
      setHits(resetHits);
    }, 150);
  };

  return (
    <div className="w-full h-64 bg-[#050505] border border-[#39FF14]/30 p-4 flex flex-col relative overflow-hidden">
      <div className="text-[10px] opacity-50 tracking-[0.3em] absolute top-2 left-2 z-10">RHYTHM_ENGINE_SIM</div>

      {/* 3 Lanes */}
      <div className="flex-1 flex justify-center gap-4 mt-6">
        {['GUITAR', 'DRUMS', 'BASS'].map((lane, i) => (
          <div key={lane} className="w-16 h-full border-x border-[#39FF14]/10 relative flex flex-col justify-end pb-2 group">
            {/* Falling Note Simulation */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-12 h-4 border-2 border-[#39FF14] bg-black animate-[drop_2s_linear_infinite] opacity-50`} style={{ animationDelay: `${i * 0.5}s` }}></div>

            {/* Target Box */}
            <div
              className={`w-14 h-8 mx-auto border-2 transition-all duration-75 flex items-center justify-center cursor-pointer select-none
                ${hits[i] ? 'bg-[#39FF14] border-[#39FF14] shadow-[0_0_20px_#39FF14] scale-110' : 'bg-black border-[#39FF14]/50 hover:border-[#39FF14]'}`}
              onMouseDown={() => triggerHit(i)}
            >
               <span className={`text-[8px] font-bold ${hits[i] ? 'text-black' : 'text-[#39FF14]/50'}`}>HIT</span>
            </div>

            <span className="text-[10px] text-center mt-2 opacity-50 tracking-widest">{lane}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 17. Corporate Sellout Contract (Brand Deals)
export const SelloutContract = () => {
  const [signed, setSigned] = useState(false);

  return (
    <div className={`w-full border-4 p-6 relative transition-all duration-500 ${signed ? 'border-[#39FF14] bg-[#39FF14]/5' : 'border-[#39FF14]/30 bg-black'}`}>
      <div className="absolute top-0 right-0 p-2 border-l border-b border-[#39FF14]/30 text-[8px] opacity-50">DOCUMENT: CONFIDENTIAL</div>

      <h3 className="text-xl font-bold tracking-[0.2em] uppercase mb-4 border-b-2 border-[#39FF14]/30 pb-2">Binding Agreement</h3>

      <div className="text-xs leading-relaxed opacity-80 flex flex-col gap-3 font-mono">
        <p>This agreement binds NEUROTOXIC to <span className="bg-[#39FF14] text-black font-bold px-1">MEGA_CORP_INC</span>.</p>
        <p>The Artist agrees to <span className="bg-[#39FF14] text-[#39FF14] select-none hover:text-black transition-colors">subliminally insert corporate messaging</span> during all live performances in sector 4.</p>
        <p>Failure to comply will result in <span className="bg-red-600 text-red-600 select-none">immediate termination of organic functions</span>.</p>

        <div className="mt-4 border-t border-dashed border-[#39FF14]/50 pt-4 flex justify-between items-end">
          <div className="flex flex-col gap-1 w-1/2">
            <span className="text-[10px] opacity-50">SIGNATURE (BLOOD/VOID):</span>
            {signed ? (
              <span className="font-script text-2xl text-[#39FF14] -rotate-6 tracking-widest animate-pulse">Neurotoxic</span>
            ) : (
              <div className="h-8 border-b-2 border-[#39FF14] w-full cursor-pointer hover:bg-[#39FF14]/20 transition-colors" onClick={() => setSigned(true)}></div>
            )}
          </div>

          <div className={`transition-all duration-500 ${signed ? 'opacity-100 scale-100' : 'opacity-0 scale-150'}`}>
            <CorporateSeal className="w-16 h-16 text-[#39FF14]" />
            <div className="text-[8px] text-center mt-1">SEALED</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 18. Toxic Hate Feed (Chatter Overlay)
export const ToxicChatter = () => {
  const [messages, setMessages] = useState([
    { id: 1, user: "VOID_WALKER", text: "this band is dead lol", type: "hate" },
    { id: 2, user: "TRUE_SCUM", text: "PLAY THE OLD SHIT!!!", type: "hate" },
    { id: 3, user: "SYS_ADMIN", text: "WARNING: CROWD HOSTILITY RISING", type: "system" }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newHate = [
        "sellouts.", "can't even stay in rhythm", "BOOOOOOOOO", "my ears are bleeding (in a bad way)", "refund immediately"
      ];
      const randomHate = newHate[Math.floor(Math.random() * newHate.length)];
      setMessages(prev => {
        const updated = [...prev, { id: Date.now(), user: `USER_${Math.floor(Math.random()*999)}`, text: randomHate, type: "hate" }];
        return updated.slice(-5); // Keep only last 5
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-64 border border-[#39FF14]/30 bg-[#020202] p-4 flex flex-col justify-end relative shadow-[inset_0_0_20px_rgba(57,255,20,0.05)]">
      <div className="absolute top-2 left-2 text-[10px] tracking-widest opacity-50">LIVE_CHATTER_FEED</div>

      <div className="flex flex-col gap-2 overflow-hidden">
        {messages.map((msg, i) => (
          <div
            key={msg.id}
            className={`text-xs p-2 animate-[slideIn_0.2s_ease-out] ${msg.type === 'system' ? 'border border-[#39FF14] bg-[#39FF14]/10' : 'border-l-2 border-[#39FF14]/30'}`}
            style={{ opacity: 0.4 + (i * 0.15) }} // Fade out older messages
          >
            <span className="font-bold opacity-70">[{msg.user}]: </span>
            <span className={`${msg.type === 'hate' ? 'chromatic-text' : 'text-[#39FF14]'}`}>{msg.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 19. Void Decryptor (Unlocks/Lore)
export const VoidDecryptor = () => {
  const [decrypted, setDecrypted] = useState(false);
  const [glitchText, setGlitchText] = useState("0x8F9A... ENCRYPTED");

  useEffect(() => {
    if (!decrypted) {
      const interval = setInterval(() => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*";
        let str = "";
        for(let i=0; i<15; i++) str += chars.charAt(Math.floor(Math.random() * chars.length));
        setGlitchText(str);
      }, 50);
      return () => clearInterval(interval);
    } else {
      setGlitchText("ITEM_UNLOCKED: 'VOID_CORE'");
    }
  }, [decrypted]);

  return (
    <div className="w-full h-64 border-2 border-[#39FF14]/50 bg-black flex flex-col items-center justify-center p-6 relative group cursor-pointer" onClick={() => setDecrypted(true)}>

      {/* Glitch Frame Corners */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#39FF14] transition-all duration-300 group-hover:p-2"></div>
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#39FF14] transition-all duration-300 group-hover:p-2"></div>

      <div className={`relative transition-all duration-700 ${decrypted ? 'scale-125' : 'scale-100 animate-[pulse_0.1s_infinite]'}`}>
        <BiohazardIcon className={`w-20 h-20 ${decrypted ? 'text-[#39FF14] drop-shadow-[0_0_20px_#39FF14]' : 'text-[#39FF14]/30'}`} />

        {/* Scrambler Overlay */}
        {!decrypted && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center mix-blend-overlay">
            <div className="w-full h-2 bg-[#39FF14] animate-[scan_1s_linear_infinite]"></div>
          </div>
        )}
      </div>

      <div className={`mt-6 font-mono text-xs tracking-[0.2em] font-bold ${decrypted ? 'text-white' : 'text-[#39FF14]/50'}`}>
        {glitchText}
      </div>

      {!decrypted && <div className="absolute bottom-4 text-[8px] opacity-50 animate-bounce">CLICK TO DECRYPT</div>}
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
