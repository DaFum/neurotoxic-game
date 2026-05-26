**Blocking**

- [src/context/usePersistence.ts](/src/context/usePersistence.ts:25): `assets`, `liabilities`, `crowdfundCampaigns` und `rngSeed` fehlen in `LOADABLE_SAVE_KEYS`, und [createPersistedState](/src/context/usePersistence.ts:96) schreibt sie ebenfalls nicht raus. Ergebnis: gekaufte Assets, laufende Loans/Crowdfunds und RNG-Determinismus gehen beim Save/Load verloren, obwohl der Load-Reducer sie sanitizen kann.
- [src/context/reducers/systemReducer.ts](/src/context/reducers/systemReducer.ts:1748): `handleAdvanceDay` macht Asset/Liability/Crowdfund/Risk-Ticks, aber keinen `applyBankruptcyCheck` gegen `getTotalDailyObligations`; `condition === 0` wird ebenfalls nicht in eine Asset-Foreclosure überführt. Damit können Asset-Upkeep/Loans Geld negativ ziehen, ohne den vorgesehenen Insolvenzpfad auszulösen.
- [src/hooks/postGig/usePostGigDerivations.ts](/src/hooks/postGig/usePostGigDerivations.ts:23) und [src/utils/postGigUtils.ts](/src/utils/postGigUtils.ts:770): Live-Flows übergeben nie `getActiveAssetModifiers(state.assets)`. Dadurch sind viele Modulboni aus Plan 2-4 im Gameplay wirkungslos: `fuelMultiplier`, `tipBonusGigs`, `avgMerchSalePriceBonus`, `merchCapacityBonus`, Studio-Economy-Boni usw. sind nur in isolierten Utility-Tests verdrahtet. Travel/Refuel nutzt ebenfalls nur Defaults, z.B. [useTravelLogic.ts](/src/hooks/useTravelLogic.ts:604).

**Important**

- [src/utils/seededRng.ts](/src/utils/seededRng.ts:39): `nextSeed()` nutzt `| 0` und erzeugt signed Werte. Beispiel lokal: Seeds `1`, `2`, `42`, `12345`, `0xffffffff` liefern alle negative Seeds. [sanitizeRngSeed](/src/context/reducers/assetSanitizers.ts:327) verwirft negative Seeds beim Load auf `Date.now()`, sobald `rngSeed` persistiert wird. Das bricht die im Spec geforderte Save/Reload-Deterministik.
- [src/context/reducers/assetReducer.ts](/src/context/reducers/assetReducer.ts:384): der `RESOLVE_CROWDFUND`-Handler schreibt Fame auf `state.band.fame` statt `state.player.fame` und baut DIY-Konfig erneut über `buildDiyTier` statt `CHASSIS_CONFIG[kind][flavor][tier]` zu lesen. Der aktuelle `processCrowdfundTick`-Pfad ist besser, aber diese Action ist weiterhin im Reducer registriert.
- [src/context/assetActionCreators.ts](/src/context/assetActionCreators.ts:203): `INSTALL_MODULE` prüft keine verfügbaren Mittel; der Reducer zieht einfach Kosten ab [assetReducer.ts](/src/context/reducers/assetReducer.ts:149). Gleiches Muster bei Upgrade und Repair. Die UI blockt Install ebenfalls nur wegen Locks/Exclusivity, nicht wegen Geld [ModulePickerModal.tsx](/src/components/assets/ModulePickerModal.tsx:112).

**Checks**

- `pnpm run typecheck:core` läuft grün.
- Fokussierte Asset-Tests liefen nicht grün: `34/35` pass. Failure in [tests/node/assetActionCreators.test.js](/tests/node/assetActionCreators.test.js:155): Der Test erwartet für `studio_chassis` Tier 3 noch `UNKNOWN_KIND_OR_TIER`, aber Plan 3 hat Studio inzwischen befüllt, daher kommt aktuell `INSUFFICIENT_FUNDS`. Der Test ist nach Plan 3 veraltet und sollte z.B. auf `merch_workshop_chassis` zeigen oder die Erwartung anpassen.
