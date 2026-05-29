# Neurotoxic — UI/UX Design Audit

**Scope:** `src/components/`, `src/scenes/`, `src/overlays/` (absent), `src/ui/`, `src/index.css`, `src/overworld.css`, `src/components/assets/assetsHub.css`, `src/components/ReloadPrompt.css`, Pixi render utilities, inline-SVG components.
**Mode:** Read-only. No files were modified.
**Date:** 2026-05-29 (supersedes the 2026-05-28 audit — see "Changes since prior audit" below).
**Convention sources:** `AGENTS.md` (root + nested), `CLAUDE.md`, `src/index.css` (`@theme`), `src/utils/brandColors.ts`, and the `convention-keeper-brutalist-ui` / `tailwind-v4-css-variables-enforcer` skills.

---

## Summary

The codebase is **unusually disciplined on raw color hygiene**. Verified by grep: **zero** hardcoded hex/`rgb()`/`hsl()` brand-color literals in `.tsx/.jsx/.ts/.js` outside the sanctioned `brandColors.ts` and `index.css`; **zero** Pixi `0x` color literals; **zero** Tailwind default-palette numeric utilities (`bg-red-500` etc.); **zero** invented aliases (`--color-void`, `--color-blood`, `--color-toxic-red` no longer exist); and inline-SVG `fill`/`stroke` consistently use `currentColor` or `var(--color-*)`. The real issues cluster around **(a) Tailwind-v4 syntax inconsistency** (arbitrary `bg-(--color-*)` and `font-[Metal_Mania]` forms that bypass native `@theme` token utilities), **(b) hardcoded z-index** duplicating the `--z-*` scale, **(c) `vh` instead of `dvh`/`svh`** on mobile-constrained modals, **(d) non-standardized modal/HUD/header chrome** across scenes, **(e) a large body of dead CSS** in `overworld.css` plus dead `@theme` tokens, and **(f) low-contrast blood-red/cosmic-purple text + incomplete `prefers-reduced-motion` coverage**.

### Counts per category

| #   | Category                   |   HIGH |    MED |    LOW |   Total |
| --- | -------------------------- | -----: | -----: | -----: | ------: |
| 1   | Color violations           |      2 |     26 |      2 |      30 |
| 2   | Responsive / breakpoint    |      4 |      7 |      4 |      15 |
| 3   | Sizing & spacing           |      0 |     13 |     16 |      29 |
| 4   | Tailwind v4 / token syntax |      2 |      5 |      3 |      10 |
| 5   | Cross-platform / device    |      0 |      4 |      2 |       6 |
| 6   | Consistency across scenes  |      3 |     11 |      5 |      19 |
| 7   | Dead / unreachable styles  |      0 |     18 |     30 |      48 |
|     | **Total**                  | **11** | **84** | **62** | **157** |

> **Counting notes:** Each finding is counted once, in its primary category. Items referenced from another
> section's prose (e.g. a dead token also cited in the top-10 summary) are not re-counted. Positives and the
> "Changes since prior audit" list are not findings and are excluded from the totals.

### Top 10 highest-impact items

1. **`EventModal.tsx:245` & `QuestsModal.tsx:303` hardcode `z-[100]`** — duplicates `--z-modal:100`. (Cat 4, HIGH)
2. **The four overlay modals split into two z-tiers** — EventModal/QuestsModal at `z-[100]`, MerchPressModal/PirateRadioModal at `z-50` → modals can stack incorrectly over each other. (Cat 6, HIGH)
3. **All height-constrained modals use `vh` not `dvh`/`svh`** (`QuestsModal:311`, `PirateRadioModal:64`, `ContrabandStash:255/259`, `mainmenu` modals) — clip under mobile browser chrome. (Cat 2, HIGH)
4. **`EventModal` has no height constraint or internal scroll at all** — a long 4-option event overflows short/mobile viewports. (Cat 2, HIGH)
5. **`ContrabandStash.tsx` uses the arbitrary `bg-(--color-*)`/`text-(--color-*)` form file-wide** (~21 occurrences) while the entire rest of the codebase uses native `@theme` utilities. (Cat 1/4)
6. **Brutalist `rounded-*` violations** in `DealCard.tsx` (2), `QuestsModal.tsx` (3), `ContrabandStash.tsx` (3, incl. `rounded-sm`), `GlossaryTab.tsx` (1). (Cat 6, HIGH/MED)
7. **Nine HUD components hardcode raw `z-50/40/20/10/0`** duplicating `--z-*` tokens the root `GigHUD`/`PixiStage` already reference via `z-(--z-…)`. (Cat 4, HIGH/MED)
8. **Modal chrome is not standardized** — border width (`border-4` vs `border-2`), max-width (`lg`/`2xl`/`4xl`), padding (`p-8`/`p-6`/`p-4`), backdrop opacity (`/80` vs `/90`, blur present/absent), shadow (`40px-glow` vs `30px-20`). Strong case for a shared modal shell. (Cat 6, HIGH)
9. **One font family written three ways** — `font-['Metal_Mania']`, `font-[Metal_Mania]`, and `font-display`/`font-ui` aliases — none use the native `font-display` token, so the `cursive` fallback in `--font-display` is dropped. (Cat 4/6, MED)
10. **~30 dead selectors in `overworld.css`** (entire map-node render path + `.scan`/`.noise`/`.radio*`) plus **14 dead `@theme` tokens** and **4 dead keyframes**. (Cat 7, MED)

### Changes since prior audit (2026-05-28)

Several HIGH items from the previous `DESIGN_AUDIT.md` are now **fixed** and intentionally not re-listed:

- Invented aliases `--color-void` / `--color-blood` in asset modals — **gone** (grep confirms only `--color-void-black` / `--color-blood-red`).
- `#root` `100vh` — now `100dvh` + `min-height: 100svh` (`index.css:160-167`).
- Rhythm-lane fixed 360px / negative `startX` — `buildRhythmLayout` now clamps `layoutScale = min(1, max(0,w)/360)` and `startX = max(0, …)` (`stageRenderUtils.ts:176,235-240`).
- PreGig old `bg-[var(--…)]` Tailwind syntax — **gone** (zero `bg-[var(` matches anywhere).
- Pixi fallback color literals — `OverworldMap`/`stageRenderUtils` derive from `BRAND_COLOR_HEX`; no `0x` literals found.

---

## 1. Color Violations

> Verified via `Grep`: `#[0-9a-fA-F]{3,8}`, `(rgb|hsl)\(`, `0x[0-9a-fA-F]{3,8}`, `\[(#|rgb|hsl)`, default-palette utilities, `(fill|stroke)="#"`, and `--color-(void|blood|toxic-red)\b`. No raw brand-color literals or invented aliases exist — findings are non-idiomatic token-syntax, two default-palette `white` usages, and contrast.

### HIGH

```
HIGH | src/ui/GigModifierButton.tsx:47 | bg-white/5 | Tailwind default-palette `white` (use bg-star-white/5) | REPLACE-WITH-TOKEN
HIGH | src/ui/SupplyStopModal.tsx:76 | hover:text-white | default-palette `white` (use text-star-white) | REPLACE-WITH-TOKEN
```

### MED — `ContrabandStash.tsx` arbitrary `*-(--color-*)` form (native utilities exist)

Single file-wide outlier; every other audited file uses native `@theme` utilities. Replace `bg-(--color-x)`→`bg-x`, `text-(--color-x)`→`text-x`, etc.

```
MED | src/ui/ContrabandStash.tsx:64 | text-(--color-ash-gray) | use text-ash-gray | REPLACE-WITH-TOKEN
MED | src/ui/ContrabandStash.tsx:66 | text-(--color-electric-blue) | use text-electric-blue | REPLACE-WITH-TOKEN
MED | src/ui/ContrabandStash.tsx:68 | text-(--color-toxic-green) | use text-toxic-green | REPLACE-WITH-TOKEN
MED | src/ui/ContrabandStash.tsx:70 | text-(--color-alert-amber) | use text-alert-amber | REPLACE-WITH-TOKEN
MED | src/ui/ContrabandStash.tsx:86 | border/text/bg-(--color-blood-red[-20]) | native utilities exist | REPLACE-WITH-TOKEN
MED | src/ui/ContrabandStash.tsx:87 | border/text/bg-(--color-electric-blue[-20]) | native utilities exist | REPLACE-WITH-TOKEN
MED | src/ui/ContrabandStash.tsx:90 | bg-(--color-void-black) border-(--color-toxic-green) | use bg-void-black border-toxic-green | REPLACE-WITH-TOKEN
MED | src/ui/ContrabandStash.tsx:94 | text-(--color-toxic-green) | use text-toxic-green | REPLACE-WITH-TOKEN
MED | src/ui/ContrabandStash.tsx:122 | text-(--color-ash-gray) | use text-ash-gray | REPLACE-WITH-TOKEN
MED | src/ui/ContrabandStash.tsx:131 | border-(--color-toxic-green-20) bg-(--color-void-black) | native utilities exist | REPLACE-WITH-TOKEN
MED | src/ui/ContrabandStash.tsx:146 | text-(--color-ash-gray) | use text-ash-gray | REPLACE-WITH-TOKEN
MED | src/ui/ContrabandStash.tsx:165 | text-(--color-blood-red) | use text-blood-red | REPLACE-WITH-TOKEN
MED | src/ui/ContrabandStash.tsx:173 | text/border/bg-(--color-electric-blue[-10/-20]) | native utilities exist | REPLACE-WITH-TOKEN
MED | src/ui/ContrabandStash.tsx:188 | text/border/bg-(--color-electric-blue[-10/-20]) | native utilities exist | REPLACE-WITH-TOKEN
MED | src/ui/ContrabandStash.tsx:262 | text-(--color-ash-gray) | use text-ash-gray | REPLACE-WITH-TOKEN
MED | src/ui/ContrabandStash.tsx:271 | bg-(--color-shadow-black) border-(--color-toxic-green-20) | native utilities exist | REPLACE-WITH-TOKEN
MED | src/ui/ContrabandStash.tsx:272 | text-(--color-toxic-green) | use text-toxic-green | REPLACE-WITH-TOKEN
MED | src/ui/ContrabandStash.tsx:286 | focus-visible:ring-(--color-toxic-green) | use ring-toxic-green | REPLACE-WITH-TOKEN
MED | src/ui/ContrabandStash.tsx:288 | border/bg/text-(--color-toxic-green[-20])/star-white | native utilities exist | REPLACE-WITH-TOKEN
MED | src/ui/ContrabandStash.tsx:289 | border/text-(--color-ash-gray) hover:*-(--color-toxic-green) | native utilities exist | REPLACE-WITH-TOKEN
MED | src/ui/ContrabandStash.tsx:303 | text-(--color-ash-gray) border-(--color-toxic-green-20) | native utilities exist | REPLACE-WITH-TOKEN
```

### MED — contrast (WCAG AA: 4.5:1 normal text, 3:1 large)

```
MED | (palette) blood-red #cc0000 on void-black #0a0a0a | ~3.4:1 | passes AA for large text only; fails for normal text. Used for normal-size text in ContrabandStash:165 (text-xs), OverworldHUD crit/low labels, asset-modal warnings (`<p style={{color:'var(--color-blood-red)'}}>` in ForeclosureModal/ChassisAcquisitionModal/LiabilitiesPanel/SellConfirm/UpgradeConfirm), overworld.css .el-msg.t-warn | FIX-CONTRAST
MED | (palette) cosmic-purple #6600cc on void-black #0a0a0a | ~2.3:1 | fails AA at all sizes; used as text color in overworld.css:708 `.el-msg.t-special` (event-log "special" entries) | FIX-CONTRAST
```

### MED — other syntax / consistency

```
MED | src/components/assets/AssetsStatusStrip.tsx:61 | divide-[rgb(var(--color-ash-gray-rgb)_/_35%)] | token-based but verbose arbitrary form; divide-ash-gray/35 is cleaner | REPLACE-WITH-TOKEN
MED | src/ui/bandhq/BrandDealsTab.tsx:45 | shadow-[0_0_15px_var(--color-toxic-green)] | active-deal glow diverges from sibling tab cards (no glow); token correct but inconsistent | NORMALIZE-SCALE
```

### LOW

```
LOW | src/ui/EventModal.tsx:254 | rgb(var(--color-void-black-rgb) / 50%) inline | token-based (idiomatic); a defined --color-shadow-overlay covers similar intent | REMOVE-HARDCODE
LOW | src/assets/react.svg:1 | fill="#..." | stock Vite logo asset, not brand UI | (informational)
```

---

## 2. Responsive / Breakpoint Issues

### HIGH

```
HIGH | src/ui/QuestsModal.tsx:311 | max-h-[90vh] | uses vh not dvh/svh; mobile chrome clips modal | WIRE-RESPONSIVE
HIGH | src/ui/PirateRadioModal.tsx:64 | max-h-[85vh] | uses vh not dvh/svh | WIRE-RESPONSIVE
HIGH | src/ui/ContrabandStash.tsx:255,259 | max-h-[90vh]/max-h-[85vh] | both Modal + Panel use vh not dvh/svh | WIRE-RESPONSIVE
HIGH | src/ui/EventModal.tsx:259-270 | max-w-lg ... p-8 (no max-h, no overflow) | no height constraint or internal scroll; long event text overflows small screens; only modal lacking max-h | ADD-BREAKPOINT
```

### MED

```
MED | src/scenes/KabelsalatScene.tsx:29 | min-h-screen | vh-based; prefer min-h-[100svh] (root uses dvh/svh) | WIRE-RESPONSIVE
MED | src/scenes/mainmenu/MainMenuSocials.tsx:23 | max-h-[80vh] | scrollable modal in vh; use dvh/svh | WIRE-RESPONSIVE
MED | src/scenes/mainmenu/MainMenuFeatures.tsx:158 | max-h-[80vh] | scrollable modal in vh; use dvh/svh | WIRE-RESPONSIVE
MED | src/ui/MerchPressModal.tsx:60 | max-w-lg overflow-hidden (no max-h) | overflow-hidden + no max-h → tall content clips, no internal scroll | WIRE-RESPONSIVE
MED | src/components/minigames/amp/AmpHUD.tsx:161 | absolute top-4 left-4 w-48 border-2 | fixed panel, no responsive reposition/scale; overlaps canvas on small screens | ADD-BREAKPOINT
MED | src/components/hud/OverloadWarning.tsx:16-17 | top-1/4 right-8 w-32 h-32 | 128px skull fixed, no responsive shrink; overlaps score/stats on narrow screens | ADD-BREAKPOINT
MED | src/index.css:904 (@media reduced-motion) | incomplete animation coverage | reduced-motion block omits animate-fuel-warning, animate-bar-fill, animate-spin (VoidLoader/main.tsx), marquee/shimmer/scan/slide-in/drop keyframes, and Tailwind animate-pulse usages — flashing/scrolling effects keep animating for motion-sensitive users | WIRE-RESPONSIVE
```

### LOW

```
LOW | src/components/minigames/tourbus/TourbusHUD.tsx:8 | absolute top-4 left-4 text-2xl | no mobile sizing variant | ADD-BREAKPOINT
LOW | src/components/minigames/roadie/RoadieHUD.tsx:9 | absolute top-4 left-4 text-xl | no mobile sizing variant | ADD-BREAKPOINT
LOW | src/components/hud/HealthBar.tsx:19 | w-[calc(100vw-2rem)] | uses 100vw not 100svw/100dvw; horizontal overflow risk under mobile chrome | WIRE-RESPONSIVE
LOW | src/ui/overworld/EventLog.tsx:105 | absolute bottom-8 left-8 | fixed inset, no sm: variant; may collide with OverworldMenu (bottom-8 right-8) | ADD-BREAKPOINT
```

> **Positives:** `overworld.css` has a full `@media (max-width:640px)` + `(pointer:coarse)` block with 44px touch targets and its own reduced-motion block; `assetsHub.css` uses `100svh` + `env(safe-area-inset-bottom)`; `ClinicScene`, `GameOverHeader`, `PreGigHeader`, `PostGig`, `BandHQ`, `BloodBankModal` use `sm:`/`md:`; pregig/postGig/assets scroll regions use `max-h-[Nsvh]`.

---

## 3. Sizing & Spacing Inconsistency

### MED

```
MED | src/components/minigames/amp/AmpHUD.tsx:35,68,137 | h-2 width-% bars | hand-rolled thin meters instead of shared BlockMeter (h-6 block style) used by HealthBar/OverloadMeter/CorruptionMeter | NORMALIZE-SCALE
MED | src/components/postGig/DealCard.tsx:153,161,169,179,211,215,254,317 | text-[10px]/text-[11px] | pervasive off-scale font sizes | NORMALIZE-SCALE
MED | src/components/pregig/SetlistBlock.tsx:79,90 | text-[9px] | smallest off-scale font size (readability + off-scale) | NORMALIZE-SCALE
MED | src/components/pregig/SetlistBlock.tsx:64,69,171,178 | text-[10px] | off-scale font size | NORMALIZE-SCALE
MED | src/components/pregig/GigModifiersBlock.tsx:90,103,119 | text-[10px] | off-scale font size | NORMALIZE-SCALE
MED | src/components/assets/AssetSlotActionList.tsx:60,77 | text-[0.62rem]/text-[0.65rem] | arbitrary rem font sizes | NORMALIZE-SCALE
MED | src/components/assets/AssetsStatusStrip.tsx:29,57 | text-[0.62rem] | arbitrary rem font size | NORMALIZE-SCALE
MED | src/components/assets/AssetSectionDeck.tsx:37 | text-[0.65rem] | arbitrary rem font size | NORMALIZE-SCALE
MED | src/components/assets/AssetsBottomTabs.tsx:35 | text-[0.65rem] | arbitrary rem font size | NORMALIZE-SCALE
MED | src/components/postGig/{DealsPhase:31,SocialPhase:40,NetResult:29,SideEffectsPreview:18,ZealotryGauge:46} | text-[10px] | repeated off-scale font size across postGig | NORMALIZE-SCALE
MED | src/scenes/kabelsalat/components/HeaderTimer.tsx:23 | text-[10px] | off-scale font size | NORMALIZE-SCALE
MED | src/ui/bandhq/ShopItem.tsx:171,185 | min-w-[80px] | magic-number min-width (use min-w-20); diverges from VoidTrader 120px | NORMALIZE-SCALE
MED | src/ui/bandhq/VoidTraderTab.tsx:131 | min-w-[120px] | magic-number min-width; inconsistent with ShopItem 80px | NORMALIZE-SCALE
```

### LOW

```
LOW | src/ui/HUD.tsx:51,70,92,195,218,284,294,297,327,339,347,359,375 | text-[11px]/[10px]/[9px] | dense cluster of off-scale font sizes | NORMALIZE-SCALE
LOW | src/ui/EventModal.tsx:75,266,324 | text-[10px] | off-scale (use text-xs) | NORMALIZE-SCALE
LOW | src/ui/overworld/OverworldMenu.tsx:70,75,121,128,135,191,195,198,203 | text-[15px]/[14px]/[13px]/[11px]/[10px]/[8px] | dense cluster of off-scale font sizes | NORMALIZE-SCALE
LOW | src/ui/overworld/OverworldHUD.tsx:328,432,437 | fontSize:8 / fontSize:10 / width:28 (inline) | raw numeric inline sizes | NORMALIZE-SCALE
LOW | src/components/hud/ComboDisplay.tsx:32,36 | text-[10px] | off-scale (also ScoreDisplay:14, ControlsHint:23-24) | NORMALIZE-SCALE
LOW | src/components/hud/StatsOverlay.tsx:26 | top-32 left-4 / max-sm:top-20 left-2 | magic-number positional offsets diverge from other HUD panels (top-4) | NORMALIZE-SCALE
LOW | src/ui/bandhq/VoidTraderTab.tsx:104 | text-[10px] | off-scale (also ToggleSwitch:66) | NORMALIZE-SCALE
LOW | src/ui/shared/ToggleSwitch.tsx:66 | text-[10px] | off-scale ON/OFF label | NORMALIZE-SCALE
LOW | src/ui/ContrabandStash.tsx:146 | min-h-[40px] | arbitrary min-height off scale | NORMALIZE-SCALE
LOW | src/components/pregig/PreGigHeader.tsx:26 | h-[1px] | 1px divider as arbitrary height (use h-px or border) | NORMALIZE-SCALE
LOW | src/components/postGig/DealCard.tsx:297 | min-w-[140px] | off-scale min-width | NORMALIZE-SCALE
LOW | src/components/postGig/SocialOptionButton.tsx:41 | min-h-[160px]/[180px] | off-scale min-heights | NORMALIZE-SCALE
LOW | src/components/postGig/CompletePhase.tsx:40 | min-h-[320px]/[400px] | off-scale min-heights | NORMALIZE-SCALE
LOW | src/components/assets/sections/TourbusTrailerOverlay.tsx:18 | w-[30%] p-[20%] | arbitrary percentage sizing | NORMALIZE-SCALE
LOW | src/scenes/gameover/GameOverStats.tsx:26 | text-[10px] | off-scale (also credits/CreditEntry:19, CreditFooter:13) | NORMALIZE-SCALE
LOW | (systemic) | no --text-*/--space-* scale in @theme | no defined type/spacing scale, so text-[Npx] proliferates; consider adding scale tokens | NORMALIZE-SCALE
```

---

## 4. Tailwind v4 / Token-Syntax Violations

> `@import "tailwindcss"` is used correctly (no `@tailwind base/components/utilities`). No `bg-[var(--…)]` (v3 arbitrary-var) forms exist. Violations are hardcoded z-index and arbitrary forms where a native `@theme` utility exists.

### HIGH

```
HIGH | src/ui/EventModal.tsx:245 | z-[100] | duplicates --z-modal:100; use z-(--z-modal) | REPLACE-WITH-TOKEN
HIGH | src/ui/QuestsModal.tsx:303 | z-[100] | duplicates --z-modal:100; use z-(--z-modal) | REPLACE-WITH-TOKEN
```

### MED

```
MED | src/ui/MerchPressModal.tsx:54 | z-50 | modal should be z-(--z-modal); sits below z-100 modals → stacking bug | REPLACE-WITH-TOKEN
MED | src/ui/PirateRadioModal.tsx:59 | z-50 | modal should be z-(--z-modal) | REPLACE-WITH-TOKEN
MED | src/ui/HUD.tsx:152 | z-40 | HUD overlay uses z-40 (--z-stage-controls); semantically z-(--z-hud) | REPLACE-WITH-TOKEN
MED | src/ui/overworld/OverworldMenu.tsx:532 | z-50 | raw z-50 → z-(--z-hud) | REPLACE-WITH-TOKEN
MED | (codebase-wide) | font-[Metal_Mania] vs font-['Metal_Mania'] vs font-display | one family written 3 ways; arbitrary forms bypass --font-display token and drop its `cursive` fallback. Prefer native font-display/font-ui | REPLACE-WITH-TOKEN
```

### LOW

```
LOW | src/components/hud/ToxicModeFlash.tsx:12 | z-0 | raw z-0 (no token); inconsistent with token-based stacking | REPLACE-WITH-TOKEN
LOW | src/ui/shared/Tooltip.tsx:175 | z-50 | duplicates --z-hud; use z-(--z-hud) | REPLACE-WITH-TOKEN
LOW | src/overworld.css:14,27,99,361,422,431,491,551,615 | z-index: 29/28/40/50/10/20/60/0/1 | raw integer z-index in CSS bypasses --z-* token scale | REPLACE-WITH-TOKEN
```

#### Full hardcoded-z roster (all duplicate a `--z-*` value)

```
HIGH | src/components/hud/GameOverOverlay.tsx:15 | z-50 → z-(--z-hud) (modal-level; consider --z-modal)
HIGH | src/components/hud/PauseButton.tsx:17 | z-50 → z-(--z-hud)
MED  | src/components/hud/LaneInputArea.tsx:74 | z-40 → z-(--z-stage-controls)
MED  | src/components/hud/OverloadWarning.tsx:16 | z-20 → z-(--z-stage)
MED  | src/components/hud/ToxicHazardTicker.tsx:17 | z-20 → z-(--z-stage)
MED  | src/components/hud/HealthBar.tsx:19 | z-10 → z-(--z-stage-bg)
MED  | src/components/hud/ControlsHint.tsx:15 | z-10 → z-(--z-stage-bg)
MED  | src/components/minigames/gig/BandMembersLayer.tsx:15 | z-10 → z-(--z-stage-bg)
MED  | src/ui/overworld/EventLog.tsx:105 | z-20 → z-(--z-stage)
MED  | src/scenes/GameOver.tsx:36 | z-50 → z-(--z-hud)
MED  | src/scenes/Settings.tsx:28 | z-50 → z-(--z-hud)
MED  | src/scenes/Credits.tsx:47 | z-50 → z-(--z-hud)
MED  | src/scenes/Overworld.tsx:171 | z-50 → z-(--z-hud)
MED  | src/scenes/intro/components/AutoplayOverlay.tsx:12 | z-50 → z-(--z-modal)
MED  | src/scenes/intro/components/SkipButton.tsx:12 | z-50 → z-(--z-hud)
LOW  | src/scenes/kabelsalat/components/overlays/{ShockOverlay,PoweredOnOverlay,KabelsalatGameOverOverlay}.tsx | z-40 (board-local) → z-(--z-stage-controls)
LOW  | src/scenes/kabelsalat/components/KabelsalatBoard.tsx:65,101 | z-20/z-10 (board-local) → tokens
```

> **Clean (do NOT touch):** `GigHUD` (`z-(--z-stage-overlay)`), `PixiStage` (`z-(--z-stage)`), `PauseOverlay`/`AudioLockedOverlay` (`zIndex: var(--z-modal)`), `DebugLogViewer` (`var(--z-debug)`), `CrashHandler` (`var(--z-crash)`), `TutorialManager` (`z-(--z-tutorial)`), `ToastOverlay`/`ReloadPrompt.css` (`var(--z-toast)`).

---

## 5. Cross-Platform / Device Gaps

### MED — touch targets < 44×44px

```
MED | src/ui/bandhq/VoidTraderTab.tsx:131 | py-1 px-4 min-w-[120px] | trade button ~28px tall, below 44px touch minimum | WIRE-RESPONSIVE
MED | src/ui/bandhq/ShopItem.tsx:171,185 | GlitchButton size='sm' min-w-[80px] | BUY/OWNED below 44px, no responsive bump | WIRE-RESPONSIVE
MED | src/components/minigames/tourbus/TourbusControls.tsx:12-27 | two w-1/2 h-full buttons (aria-only) | adequate size but no visible touch affordance/label | WIRE-RESPONSIVE
MED | src/components/hud/CorruptionMeter.tsx:18 | "BURST ARMED" literal | English string not wrapped in i18n t() unlike sibling meters | REMOVE-HARDCODE
```

### LOW

```
LOW | src/components/assets/{LoanProfileModal,ForeclosureModal,RiskEventModal}.tsx:25/26/29 | max-w-* (no assets-modal-sheet) | 3 asset modals skip the shared mobile bottom-sheet class (safe-area + svh) used by the other 6 | WIRE-RESPONSIVE
LOW | src/components/hud/HealthBar.tsx:19 | 100vw (see Cat 2) | DPR/dynamic-viewport horizontal overflow risk | WIRE-RESPONSIVE
```

> **Positives:** Pixi resolution uses `getOptimalResolution()` in `stageRenderUtils` (no hardcoded `resolution:1` — DPR-safe, per `src/components/stage/AGENTS.md`). `OverworldHUD.tsx:370` uses `!w-11 !h-11` (44px) on mobile. `DeadmanButton` wires `onTouchStart`/`onTouchEnd`. `SkipButton`, `assetsHub.css`, `ReloadPrompt.css` use `env(safe-area-inset-*)`. No orientation-locked layouts.

---

## 6. Consistency Across Scenes

### HIGH

```
HIGH | EventModal:262 / QuestsModal:311 / MerchPressModal:60 / PirateRadioModal:64 | border-2 vs border-4 vs border-2 vs border-2 | QuestsModal uses border-4; others border-2 — inconsistent modal border weight | NORMALIZE-SCALE
HIGH | EventModal:245 z-[100] / QuestsModal:303 z-[100] / MerchPressModal:54 z-50 / PirateRadioModal:59 z-50 | two modals at 100, two at 50 → can stack incorrectly relative to each other | REPLACE-WITH-TOKEN
HIGH | DealCard:153,161 / QuestsModal:210,248,261 / ContrabandStash:111,131,271 / GlossaryTab:91 | rounded / rounded-sm | brutalist no-rounded-corner rule broken on badges/chips/panels across files | REMOVE-HARDCODE
```

### MED

```
MED | EventModal max-w-lg / QuestsModal max-w-2xl / MerchPress max-w-lg / PirateRadio max-w-lg / ContrabandStash max-w-4xl | divergent modal max-width, no shared convention | NORMALIZE-SCALE
MED | EventModal p-8 / QuestsModal p-6 / MerchPress p-6 / PirateRadio p-4 sm:p-6 | divergent modal body padding | NORMALIZE-SCALE
MED | EventModal backdrop /80 +blur / QuestsModal /80 no-blur / MerchPress /90 +blur / PirateRadio /90 +blur | divergent backdrop opacity + QuestsModal omits backdrop-blur | NORMALIZE-SCALE
MED | EventModal shadow 0_0_40px-glow / QuestsModal+MerchPress+PirateRadio 0_0_30px-20 | divergent modal glow shadow | NORMALIZE-SCALE
MED | QuestsModal:326 SVG close / MerchPress:153 text [X] / PirateRadio:84 text [X] / EventModal none | inconsistent close-affordance pattern | NORMALIZE-SCALE
MED | AmpHUD (bg /80, p-4, border-2 toxic-green) vs RoadieHUD (bg /50, p-2, border star-white/20) vs TourbusHUD (no bg/border) | three different minigame-HUD panel treatments | NORMALIZE-SCALE
MED | PreGigHeader (font-['Metal_Mania'] + gradient divider) vs ClinicHeader (border-b 1px) vs kabelsalat Header (border-b-2) | three divergent scene-header treatments | NORMALIZE-SCALE
MED | src/ui/settings/DataManagement.tsx:16,20 | font-display/font-ui + text-blood-red heading | diverges from 4 sibling settings sections (font-[Metal_Mania], text-toxic-green, border-b) | NORMALIZE-SCALE
MED | src/ui/settings/SettingsTitle.tsx:6 | font-['Metal_Mania'] | third font syntax in the same panel | NORMALIZE-SCALE
MED | bandhq cards: StatsTab/GlossaryTab border-2 border-ash-gray vs VoidTraderTab/BrandDealsTab border (1px) | sibling tabs mix 1px/2px card borders + different colors | NORMALIZE-SCALE
MED | bandhq headings: StatsTab/GlossaryTab h3 border-b underline vs VoidTraderTab:59 no underline | section-heading treatment differs across sibling tabs | NORMALIZE-SCALE
```

### LOW

```
LOW | src/components/postGig/FinancialColumn.tsx:35,41 | border-b-2 then border-t (1px) | mixes border-2 and 1px within one component | NORMALIZE-SCALE
LOW | src/components/postGig/NegotiationModal.tsx:12,22,33 | border (1px) primary buttons | rest of postGig uses border-2 | NORMALIZE-SCALE
LOW | src/components/clinic/ClinicMemberCard.tsx:47 | border (1px) card | vs border-2 cards elsewhere | NORMALIZE-SCALE
LOW | src/ui/overworld/OverworldMenu.tsx:107,167,181 | !border-t-0 !border-x-0 !border-b | !important border overrides vs border-2 convention | NORMALIZE-SCALE
LOW | HUD panels shadow-[4px_4px_0px] (hard) vs modals shadow-[0_0_30px] (glow) | two shadow languages coexist (both intentional; flagged for awareness) | NORMALIZE-SCALE
```

> **Positives:** the shared `GlitchButton` primitive is used widely and consistently; `assets/` section views share `assets-modal-sheet`, `assets-hub-panel`, and the `--section-accent` token mechanism.

---

## 7. Dead / Unreachable Styles

### Dead `@theme` tokens — definition-only, zero references (verified by Grep)

```
MED | src/index.css:23  | --color-toxic-green-mutated   | UNUSED
MED | src/index.css:20  | --color-toxic-green-light     | UNUSED
MED | src/index.css:81  | --color-void-blue             | UNUSED
MED | src/index.css:87  | --color-purple-glow           | UNUSED (dup of --color-cosmic-purple-glow)
MED | src/index.css:103 | --color-warning-orange        | UNUSED
MED | src/index.css:123 | --color-overlay               | UNUSED
MED | src/index.css:117 | --color-panel-bg              | UNUSED
MED | src/index.css:118 | --color-disabled-bg           | UNUSED
MED | src/index.css:119 | --color-disabled-text         | UNUSED
MED | src/index.css:120 | --color-disabled-border       | UNUSED
MED | src/index.css:122 | --color-shadow-overlay-strong | UNUSED
MED | src/index.css:130 | --font-code                   | UNUSED
MED | src/index.css:61  | --color-rust-orange           | UNUSED
MED | src/index.css:63  | --color-rust-orange-bright    | UNUSED
```

### Dead keyframes / classes in `index.css`

```
MED | src/index.css:331 | @keyframes type-cursor | DEAD — "Typewriter flicker", never wired
MED | src/index.css:343 | @keyframes score-flash | DEAD — never referenced
MED | src/index.css:391 | @keyframes stagger-in  | DEAD — never referenced
MED | src/index.css:436 | @keyframes hud-bounce  | DEAD — never referenced
LOW | src/index.css:928 | .font-script           | DEAD — zero refs; removing it strands --font-script (line 131)
LOW | src/index.css:914 | .typing-text (in reduced-motion list) | ORPHAN — referenced in @media reset but class never defined/applied
```

### Dead selectors in `overworld.css` (map-node render path migrated to `MapNodeView`/`TravelingVan` Tailwind markup)

> Verified: `hex-wrap`, `node-van`, `travel-path`, `particles-canvas`, `radio-dot`, `zones-svg`, `.scan`, `.noise` have **zero** references in any `.tsx/.jsx`. Only `map-node` is still applied (MapNodeView:303) and it supplies its own Tailwind layout, so the descendant rules are dead.

```
MED | overworld.css:1    | @keyframes scan-overworld | DEAD (consumed only by dead .scan)
MED | overworld.css:9    | .scan                     | DEAD — no scan overlay rendered
MED | overworld.css:24   | .noise                    | DEAD — no noise overlay rendered
MED | overworld.css:356  | .radio                    | DEAD — radio widget rebuilt in Tailwind (Overworld.tsx:171)
MED | overworld.css:371  | @keyframes rdot           | DEAD
MED | overworld.css:380  | .radio-dot                | DEAD
MED | overworld.css:388  | .radio-freq               | DEAD
MED | overworld.css:392  | .radio-btn                | DEAD
LOW | overworld.css:480  | .hex-wrap                 | DEAD
LOW | overworld.css:489  | .map-node.clickable:hover .hex-wrap | DEAD
LOW | overworld.css:493  | .glyph                    | DEAD
LOW | overworld.css:503  | .node-van + @keyframes vanbob (521) | DEAD
LOW | overworld.css:524  | .node-badge               | DEAD
LOW | overworld.css:530  | .node-lbl                 | DEAD (also in @media 1250,1300)
LOW | overworld.css:539  | .confirm-lbl + @keyframes bl (562) | DEAD
LOW | overworld.css:566  | .n-hidden (+ descendants) | DEAD
LOW | overworld.css:574  | .n-dimmed (+ descendants) | DEAD
LOW | overworld.css:581  | .n-current .node-lbl      | DEAD
LOW | overworld.css:584  | @keyframes reach-glow + .n-reachable .hex-wrap (593) | DEAD
LOW | overworld.css:596  | @keyframes pendshake + .n-pending (608) | DEAD
LOW | overworld.css:613  | .t-van                    | DEAD
LOW | overworld.css:951  | .zones-svg                | DEAD
LOW | overworld.css:960  | @keyframes node-unlock + .n-unlocked .hex-wrap (974) | DEAD
LOW | overworld.css:1325 | .travel-path              | DEAD
LOW | overworld.css:1331 | @keyframes path-draw      | DEAD
LOW | overworld.css:1340 | .particles-canvas         | DEAD
```

> **Live in `overworld.css` (do NOT remove):** `.scene`, `.hud`+`.hud-*`, `.ow-panel`/`.ow-title`/`.ow-status*`, `.map-wrap`, all `.menu-*`, `.event-log`/`.el-*`+`@keyframes cursor-blink`, `.shortcuts-panel`/`.sc-*`, `.band-*`/`.mbr-*`/`.bar-*`/`.harmony-*`/`.van-*`/`.mini-*`/`.career-*`/`.money-*`/`.loc-*`, `.mbr-crit/.mbr-low/.mbr-status-dot`, `.money-anim-up/-down`, `.ow-panel.fuel-warn`, and the `.glitch-on/.g-hue/.g-pixel` family (applied by `useGlitchEffect.ts`).

> No commented-out style blocks or permanently-false-flag style branches were found.

---

## Appendix A — Token Inventory (`src/index.css` `@theme`)

Usage = grep count across `src/**`. **UNUSED** = only its own definition exists.

| Token                                                | Verdict                                          |
| ---------------------------------------------------- | ------------------------------------------------ |
| `--color-toxic-green`                                | USED (112+ TSX)                                  |
| `--color-toxic-green-rgb`                            | USED (CSS-only, ~28)                             |
| `--color-toxic-green-dark`                           | RARE (1 — MainMenu)                              |
| `--color-toxic-green-light`                          | **UNUSED**                                       |
| `--color-toxic-green-bright`                         | USED                                             |
| `--color-toxic-green-mutated`                        | **UNUSED**                                       |
| `--color-toxic-green-glow`                           | USED                                             |
| `--color-toxic-green-50/-20/-10/-5`                  | USED (`-5` CSS-only/RARE)                        |
| `--color-void-black`                                 | USED (279)                                       |
| `--color-void-black-50`                              | RARE (1 — BrutalistUI)                           |
| `--color-void-black-rgb`                             | USED (CSS-only)                                  |
| `--color-hotspot-bg`                                 | USED (assets)                                    |
| `--color-shadow-black`                               | USED                                             |
| `--color-concrete-gray`                              | USED                                             |
| `--color-ash-gray` / `-rgb`                          | USED (238)                                       |
| `--color-abyss-black`                                | RARE (2)                                         |
| `--color-charcoal-gray`                              | RARE (2)                                         |
| `--color-steel-gray`                                 | RARE (2)                                         |
| `--color-blood-red` / `-rgb`                         | USED (115)                                       |
| `--color-blood-red-bright`                           | USED                                             |
| `--color-blood-red-dark`                             | RARE (1)                                         |
| `--color-blood-red-glow`                             | RARE (CSS-only)                                  |
| `--color-blood-red-20`                               | USED                                             |
| `--color-rust-orange`                                | **UNUSED**                                       |
| `--color-rust-orange-bright`                         | **UNUSED**                                       |
| `--color-warning-yellow` / `-rgb`                    | USED (165)                                       |
| `--color-warning-yellow-50/-30/-20`                  | `-50`/`-30` CSS-only RARE; `-20` USED            |
| `--color-rhythm-guitar/-drums/-bass`                 | RARE (2 each)                                    |
| `--color-cosmic-purple`                              | USED (13)                                        |
| `--color-cosmic-purple-glow`                         | RARE (CSS-only)                                  |
| `--color-void-purple`                                | USED (~4)                                        |
| `--color-void-blue`                                  | **UNUSED**                                       |
| `--color-star-white` / `-rgb`                        | USED (115)                                       |
| `--color-neon-cyan`                                  | USED (CSS-only, 11)                              |
| `--color-purple-glow`                                | **UNUSED** (dup)                                 |
| `--color-electric-blue` / `-20` / `-10`              | USED (23)                                        |
| `--color-hot-pink`                                   | RARE (1 — DealCard)                              |
| `--color-alert-amber`                                | RARE (1 — ContrabandStash)                       |
| `--color-success-green`                              | USED (8)                                         |
| `--color-error-red`                                  | USED (5)                                         |
| `--color-warning-orange`                             | **UNUSED**                                       |
| `--color-info-blue`                                  | USED (7)                                         |
| `--color-fuel-yellow`                                | USED (9)                                         |
| `--color-condition-blue`                             | USED (7)                                         |
| `--color-stamina-green`                              | USED (8)                                         |
| `--color-mood-pink`                                  | USED (8)                                         |
| `--color-roadie-grass` / `--color-roadie-venue-blue` | RARE (1 each)                                    |
| `--color-panel-bg`                                   | **UNUSED**                                       |
| `--color-disabled-bg/-text/-border`                  | **UNUSED** (all 3)                               |
| `--color-shadow-overlay`                             | RARE (1 — ToastOverlay)                          |
| `--color-shadow-overlay-strong`                      | **UNUSED**                                       |
| `--color-overlay`                                    | **UNUSED**                                       |
| `--font-display`                                     | USED (15)                                        |
| `--font-ui`                                          | USED (5)                                         |
| `--font-code`                                        | **UNUSED**                                       |
| `--font-script`                                      | RARE (CSS-only; consumer `.font-script` is dead) |
| `--font-asset-display` / `--font-asset-control`      | USED (assetsHub.css)                             |
| `--z-stage-bg/-stage/-stage-overlay/-stage-controls` | USED                                             |
| `--z-hud/-modal/-tutorial/-chatter/-chatter-mobile`  | USED                                             |
| `--z-crt/-debug/-toast/-crash`                       | USED                                             |

**Dead tokens to consider removing (14):** `--color-toxic-green-light`, `--color-toxic-green-mutated`, `--color-void-blue`, `--color-purple-glow`, `--color-warning-orange`, `--color-overlay`, `--color-panel-bg`, `--color-disabled-bg`, `--color-disabled-text`, `--color-disabled-border`, `--color-shadow-overlay-strong`, `--font-code`, `--color-rust-orange`, `--color-rust-orange-bright`. None appear in `BRAND_COLOR_HEX`, so removal is low-risk — but coordinate with any inline-style consumers first (`CLAUDE.md` requires `BRAND_COLOR_HEX` ↔ `index.css` sync).

---

## Appendix B — Hardcoded-Color Index

Every hex / `rgb()` / `hsl()` / default-palette literal found **outside** the sanctioned `src/utils/brandColors.ts` and `src/index.css`:

| File:line                                        | Literal                                         | Sanctioned? | Note                                            |
| ------------------------------------------------ | ----------------------------------------------- | ----------- | ----------------------------------------------- |
| src/ui/GigModifierButton.tsx:47                  | `bg-white/5`                                    | ❌          | default-palette `white` — use `bg-star-white/5` |
| src/ui/SupplyStopModal.tsx:76                    | `hover:text-white`                              | ❌          | default-palette `white` — use `text-star-white` |
| src/assets/react.svg:1                           | `fill="#..."`                                   | ⚠️          | stock Vite logo asset, not brand UI             |
| src/scenes/ClinicScene.tsx:28                    | `rgb(var(--color-void-black-rgb) / 90%)`        | ✅          | token-based opacity (idiomatic)                 |
| src/scenes/gameover/GameOverBackground.tsx:32    | `rgb(var(--color-blood-red-rgb) / 0.18)`        | ✅          | token-based opacity                             |
| src/components/assets/AssetsStatusStrip.tsx:61   | `divide-[rgb(var(--color-ash-gray-rgb)_/_35%)]` | ✅          | token-based (verbose form — Cat 1 MED)          |
| src/components/assets/AssetsBottomTabs.tsx:39,42 | `rgb(var(--color-ash-gray-rgb) / 45%)` etc.     | ✅          | token-based opacity (inline style)              |
| src/ui/EventModal.tsx:254                        | `rgb(var(--color-void-black-rgb) / 50%)`        | ✅          | token-based opacity                             |
| src/overworld.css / assetsHub.css                | `rgb(var(--color-*-rgb) / N%)` (many)           | ✅          | documented RGB-triplet opacity pattern          |

**Conclusion:** apart from two default-palette `white` usages and the stock SVG asset, there are **no hardcoded brand-color literals** anywhere in the UI source. Every other `rgb(...)` resolves a defined `--color-*-rgb` triplet token (the sanctioned opacity pattern).

---

## Methodology / Rigor Notes

- Findings were located by `Grep` against real source and the cited lines were read. Negative-lookahead patterns (e.g. `rounded-(?!none)`) were **not** trusted — the default ripgrep engine silently matched nothing for them, so `rounded-*` was re-searched with a plain literal (this surfaced the `DealCard`/`QuestsModal`/`ContrabandStash` violations a lookahead missed).
- "Missing breakpoint" claims were confirmed by checking for the absence of `sm:`/`md:`/`lg:` variants on the relevant utility.
- `BRAND_COLOR_HEX` (sanctioned to contain hex) and `index.css` were excluded from color-violation flagging.
- Contrast ratios are approximate WCAG values computed from the current `index.css` token hex values; only blood-red and cosmic-purple text uses fall below AA for normal text.
- Prior-audit items confirmed fixed (aliases, 100vh root, rhythm-lane width, old Tailwind syntax, Pixi literals) were re-verified by grep/read and excluded.
