import React, { useState } from 'react';
import { useGameState } from '../context/GameState';
import { motion } from 'framer-motion';
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen';
import { calculateGigFinancials } from '../utils/economyEngine';
import { calculateViralityScore, generatePostOptions, resolvePost } from '../utils/socialEngine';

export const PostGig = () => {
  const { changeScene, updatePlayer, player, currentGig, gigModifiers, triggerEvent, activeEvent, resolveEvent, setActiveEvent, band, updateSocial, social, lastGigStats } = useGameState();
  const [phase, setPhase] = useState('REPORT'); // REPORT, SOCIAL, COMPLETE
  const [financials, setFinancials] = useState(null);
  const [virality, setVirality] = useState(0);
  const [postOptions, setPostOptions] = useState([]);
  const [postResult, setPostResult] = useState(null);

  React.useEffect(() => {
      if (!activeEvent) {
          const financialEvent = triggerEvent('financial', 'post_gig');
          if (!financialEvent) {
              const specialEvent = triggerEvent('special', 'post_gig');
              if (!specialEvent) {
                  triggerEvent('band', 'post_gig');
              }
          }
      }
  }, []);

  // Initialize Results once (simulated)
  React.useEffect(() => {
      if (!financials) {
          // Use real score normalized to 0-100 (approx)
          // Assume max score ~ 1000 per second of song. Setlist ~ 200s. Max ~ 200k.
          // Let's simplified normalize: score / (duration * 100).
          // For now, random fallback if no stats
          const rawScore = lastGigStats?.score || 0;
          const performanceScore = Math.min(100, Math.max(50, rawScore / 500)); // Rough normalization
          
          const crowdStats = { fillRate: 0.6 + (gigModifiers.promo ? 0.2 : 0) + (Math.random() * 0.2) };
          
          // Pass player.fame and lastGigStats
          const result = calculateGigFinancials(currentGig, performanceScore, crowdStats, gigModifiers, band.inventory, player.fame, lastGigStats);
          setFinancials(result);

          const vScore = calculateViralityScore(performanceScore, [], currentGig); // events list empty for now
          setVirality(vScore);
          setPostOptions(generatePostOptions({ viralityScore: vScore }));
      }
  }, [financials]);

  const handlePostSelection = (option) => {
      const result = resolvePost(option, Math.random());
      setPostResult(result);
      
      // Apply Social Growth
      updateSocial({ 
          [result.platform]: (social[result.platform] || 0) + result.followers,
          viral: social.viral + (result.success ? 1 : 0)
      });
      
      setPhase('COMPLETE');
  };

  const EventModal = () => {
      if (!activeEvent) return null;

      const handleChoice = (choice) => {
          const result = resolveEvent(choice);
          alert(result.outcomeText + (result.description ? `\n\n> ${result.description}` : ''));
          setActiveEvent(null);
      };

      return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg border-4 border-[var(--toxic-green)] bg-black p-6 shadow-[0_0_50px_rgba(0,255,65,0.4)] relative">
                <h2 className="text-3xl font-[Metal_Mania] text-[var(--toxic-green)] mb-4 uppercase animate-pulse">
                    {activeEvent.title}
                </h2>
                <p className="font-mono text-gray-300 mb-8 text-lg leading-relaxed">
                    {activeEvent.text}
                </p>
                <div className="space-y-4">
                    {activeEvent.options.map((opt, i) => (
                        <button
                            key={i}
                            onClick={() => handleChoice(opt)}
                            className="w-full p-4 border border-[var(--ash-gray)] hover:bg-[var(--toxic-green)] hover:text-black hover:border-transparent transition-all font-bold text-left flex justify-between group"
                        >
                            <span>{opt.label}</span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                                {opt.skillCheck ? `[${opt.skillCheck.stat.toUpperCase()}]` : '>>>'}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
      );
  };

  const handleContinue = () => {
    if (financials && (player.money + financials.net) < 0) {
        alert("GAME OVER: BANKRUPT! The tour is over.");
        changeScene('MENU');
    } else {
        if (financials) {
            updatePlayer({
                money: player.money + financials.net,
                day: player.day + 1,
                fame: player.fame + 100 // Simplified fame
            });
        }
        changeScene('OVERWORLD');
    }
  };

  if (!financials) return <div>Loading...</div>;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[var(--void-black)] text-white relative">
      <div 
        className="absolute inset-0 opacity-20 bg-cover bg-center"
        style={{ backgroundImage: `url("${getGenImageUrl(IMG_PROMPTS.POST_GIG_BG)}")` }}
      ></div>
      
      <EventModal />

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-4xl w-full border-4 border-[var(--toxic-green)] p-8 bg-black relative z-10 shadow-[0_0_50px_rgba(0,255,65,0.3)] flex flex-col gap-6"
      >
        <h2 className="text-5xl text-center font-[Metal_Mania] text-[var(--toxic-green)] mb-2 text-shadow-[0_0_10px_var(--toxic-green)]">
          {phase === 'REPORT' ? 'GIG REPORT' : phase === 'SOCIAL' ? 'SOCIAL MEDIA STRATEGY' : 'TOUR UPDATE'}
        </h2>

        {phase === 'REPORT' && (
            <>
                <div className="grid grid-cols-2 gap-8 text-sm md:text-base font-mono">
                    <div>
                        <h3 className="text-[var(--toxic-green)] border-b border-gray-700 mb-2">INCOME</h3>
                        {financials.income.breakdown.map((item, i) => (
                            <div key={i} className="flex justify-between">
                                <span>{item.label}</span>
                                <span className="text-green-400">+{item.value}€</span>
                            </div>
                        ))}
                        <div className="mt-2 pt-2 border-t border-gray-800 flex justify-between font-bold">
                            <span>TOTAL</span>
                            <span>{financials.income.total}€</span>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-red-500 border-b border-gray-700 mb-2">EXPENSES</h3>
                        {financials.expenses.breakdown.map((item, i) => (
                            <div key={i} className="flex justify-between">
                                <span>{item.label}</span>
                                <span className="text-red-400">-{item.value}€</span>
                            </div>
                        ))}
                        <div className="mt-2 pt-2 border-t border-gray-800 flex justify-between font-bold">
                            <span>TOTAL</span>
                            <span>{financials.expenses.total}€</span>
                        </div>
                    </div>
                </div>
                
                <div className="text-center mt-4">
                    <div className="text-sm text-gray-500">NET PROFIT</div>
                    <div className={`text-4xl font-bold glitch-text ${financials.net >= 0 ? 'text-[var(--toxic-green)]' : 'text-red-600'}`}>
                        {financials.net >= 0 ? '+' : ''}{financials.net}€
                    </div>
                </div>

                <button onClick={() => setPhase('SOCIAL')} className="mt-4 w-full py-4 bg-[var(--toxic-green)] text-black font-bold uppercase hover:bg-white transition-colors">
                    NEXT: SOCIAL MEDIA
                </button>
            </>
        )}

        {phase === 'SOCIAL' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {postOptions.map((opt) => (
                    <button 
                        key={opt.id}
                        onClick={() => handlePostSelection(opt)}
                        className="p-4 border border-gray-700 hover:border-[var(--toxic-green)] hover:bg-[var(--toxic-green)]/10 text-left transition-all group"
                    >
                        <div className="text-xs text-gray-500 group-hover:text-white uppercase mb-1">{opt.platform}</div>
                        <div className="font-bold text-lg mb-2">{opt.title}</div>
                        <div className="text-sm text-gray-400 mb-4">{opt.description}</div>
                        <div className="flex justify-between text-xs font-mono">
                            <span>Viral Chance: {Math.round(opt.viralChance * 100)}%</span>
                            <span>Est. Gain: +{opt.effect.followers}</span>
                        </div>
                    </button>
                ))}
            </div>
        )}

        {phase === 'COMPLETE' && (
            <div className="text-center">
                <div className="mb-8">
                    <h3 className="text-2xl text-[var(--toxic-green)] mb-2">{postResult?.success ? 'VIRAL HIT!' : 'POST PUBLISHED'}</h3>
                    <p className="text-gray-300">{postResult?.message}</p>
                    <div className="text-4xl font-bold mt-4">+{postResult?.followers} Followers</div>
                    <div className="text-sm text-gray-500 uppercase mt-1">on {postResult?.platform}</div>
                </div>
                <button onClick={handleContinue} className="w-full py-4 bg-[var(--toxic-green)] text-black font-bold uppercase hover:bg-white transition-colors">
                    CONTINUE TOUR
                </button>
            </div>
        )}

      </motion.div>
    </div>
  );
};
