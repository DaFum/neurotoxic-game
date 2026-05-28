# Neurotoxic UI/UX Design Audit

Date: 2026-05-28

Scope audited: `src/components/`, `src/scenes/`, `src/index.css`, `src/overworld.css`, component CSS files, Pixi render utilities, and inline SVG components. `src/overlays/` does not exist in this checkout. Source files were not modified.

Method: loaded root/nested `AGENTS.md`, `CLAUDE.md`, `src/index.css`, `src/utils/brandColors.ts`, `stageRenderUtils.ts`, `OverworldMap.tsx`, and the local brutalist/Tailwind skills. Static scans used `rg` for hardcoded colors, token aliases, Tailwind v4 syntax, responsive units, rounded corners, z-indexes, animations, shadows, and dead selectors. Contrast ratios below are approximate WCAG ratios using the current `src/index.css` token values.

## Summary

| Category                                 |   HIGH |    MED |    LOW |  Total |
| ---------------------------------------- | -----: | -----: | -----: | -----: |
| 1. Color violations                      |      4 |      7 |      2 |     13 |
| 2. Responsive / breakpoint issues        |      3 |      7 |      2 |     12 |
| 3. Sizing & spacing inconsistency        |      1 |     10 |      3 |     14 |
| 4. Tailwind v4 / token syntax violations |      2 |      5 |      0 |      7 |
| 5. Cross-platform / device gaps          |      1 |      5 |      2 |      8 |
| 6. Consistency across scenes             |      0 |      6 |      1 |      7 |
| 7. Dead / unreachable styles             |      0 |      2 |      5 |      7 |
| **Total**                                | **11** | **42** | **15** | **68** |

Top 10 highest-impact items:

1. Invalid asset modal aliases `--color-void` and `--color-blood` can produce unreadable action/error text.
2. PreGig uses old color-variable Tailwind syntax in tabs and merch controls instead of native v4 token classes.
3. Pixi fallback color literals remain outside `BRAND_COLOR_HEX`.
4. `#root` and global overlays still use `100vh`, which is fragile under mobile browser chrome.
5. Rhythm lane layout uses a fixed 360px width and can calculate negative `startX` on very narrow viewports.
6. Overworld and global animation sets are not fully covered by `prefers-reduced-motion`.
7. Multiple normal-size blood-red/cosmic-purple text uses fail WCAG AA on `--color-void-black`.
8. Hardcoded `z-*` values and `z-[...]` bypass the z-index token system.
9. Rounded corners have re-entered PostGig, Overworld, Amp, Roadie, and Kabelsalat surfaces despite the brutalist rule.
10. `src/overworld.css` contains large unused selector groups that obscure the active styling surface.

## 1. Color Violations

- **HIGH** - `src/components/stage/stageRenderUtils.ts:45`, `defaultHexFallback`: hardcoded `#ffffff` sits outside the sanctioned `BRAND_COLOR_HEX` source. Recommended action: **REMOVE-HARDCODE**.
- **HIGH** - `src/components/stage/stageRenderUtils.ts:59`, `Number.parseInt('ffffff', 16)`: bare hex fallback bypasses `BRAND_COLOR_HEX`. Recommended action: **REMOVE-HARDCODE**.
- **HIGH** - `src/components/assets/ChassisAcquisitionModal.tsx:169`, `style.color`: invalid alias `var(--color-void)` is not defined in `src/index.css`; also occurs in `CrowdfundSetupModal.tsx:125`, `RepairConfirmModal.tsx:72`, `SellConfirmModal.tsx:93`, `UpgradeConfirmModal.tsx:101`. Recommended action: **REPLACE-WITH-TOKEN**.
- **HIGH** - `src/components/assets/LiabilitiesPanel.tsx:43`, `style.color`: invalid alias `var(--color-blood)` is not defined; also occurs in `SellConfirmModal.tsx:64`, `UpgradeConfirmModal.tsx:71`. Recommended action: **REPLACE-WITH-TOKEN**.
- **MED** - `src/scenes/MainMenu.tsx:72`, `from-black/0 to-black/90`: Tailwind default palette is used instead of `from-void-black/0 to-void-black/90` or tokenized CSS. Recommended action: **REPLACE-WITH-TOKEN**.
- **MED** - `src/scenes/gameover/GameOverStats.tsx:26`, `text-blood-red`: normal 10px blood-red text on `--color-void-black` is ~3.36:1, below WCAG AA 4.5:1. Recommended action: **FIX-CONTRAST**.
- **MED** - `src/components/ChatterOverlay.tsx:37`, `labelColor: 'text-blood-red'`: small chatter labels use blood-red on black at ~3.36:1. Recommended action: **FIX-CONTRAST**.
- **MED** - `src/components/MapNodeView.tsx:172`, `text-purple-glow`: `--color-purple-glow` is a 50% alpha glow token used as text; blended on black it is ~1.4:1. Recommended action: **FIX-CONTRAST**.
- **MED** - `src/scenes/kabelsalat/components/KabelsalatBoard.tsx:79`, `text-cosmic-purple`: cosmic-purple on void-black is ~2.30:1 for a text-xs control. Recommended action: **FIX-CONTRAST**.
- **MED** - `src/scenes/MainMenu.tsx:196`, `text-ash-gray/60`: ash-gray/60 on void-black is ~2.70:1; similar low-contrast small text appears in `CreditEntry.tsx:19`, `CreditFooter.tsx:13`, `GigModifiersBlock.tsx:119`, `ControlsHint.tsx:22`. Recommended action: **FIX-CONTRAST**.
- **MED** - `src/components/minigames/amp/AmpControls.tsx:173`, `bg-blood-red text-void-black`: void-black text on blood-red is ~3.36:1 for a normal-size button. Recommended action: **FIX-CONTRAST**.
- **LOW** - `src/components/pregig/SetlistBlock.tsx:56`, `text-blood-red/50`: locked/disabled song text blends to ~1.55:1 on black; disabled text is partly exempt but still communicates lock state. Recommended action: **FIX-CONTRAST**.
- **LOW** - `src/components/postGig/ZealotryGauge.tsx:33`, `text-blood-red/80`: small percentage text is ~2.46:1 on black. Recommended action: **FIX-CONTRAST**.

## 2. Responsive / Breakpoint Issues

- **HIGH** - `src/index.css:162`, `#root height: 100vh`: app root uses legacy viewport height and can crop under mobile browser chrome. Recommended action: **WIRE-RESPONSIVE**.
- **HIGH** - `src/components/stage/stageRenderUtils.ts:177`, `LANE_TOTAL_WIDTH = 360`: rhythm lanes do not clamp to `screenWidth`; `startX` becomes negative below 360px. Recommended action: **WIRE-RESPONSIVE**.
- **HIGH** - `src/components/ToggleRadio.tsx:41`, `sm:w-8 sm:h-8`: radio control shrinks to 32x32 at `sm+`, below the 44x44 touch target requirement on coarse-pointer tablets. Recommended action: **ADD-BREAKPOINT**.
- **MED** - `src/index.css:742`, `.noise-overlay height: 100vh`: fixed full-screen overlay uses `vh` instead of `dvh`/`svh`. Recommended action: **WIRE-RESPONSIVE**.
- **MED** - `src/overworld.css:472`, `.map-wrap max-height: calc(100vh - 220px)`: desktop map sizing uses `vh`; mobile override exists, but desktop mobile-browser-like shells remain fragile. Recommended action: **WIRE-RESPONSIVE**.
- **MED** - `src/scenes/PreGig.tsx:75`, `lg:h-[58vh]`: scene column height uses `vh`; no `dvh`/`svh` equivalent. Recommended action: **WIRE-RESPONSIVE**.
- **MED** - `src/components/pregig/SetlistBlock.tsx:126`, `max-h-[48vh] sm:max-h-[52vh]`: scroll panels use `vh` units. Recommended action: **WIRE-RESPONSIVE**.
- **MED** - `src/components/pregig/GigModifiersBlock.tsx:65`, `max-h-[38vh] sm:max-h-[42vh]`: modifier panel uses `vh` units. Recommended action: **WIRE-RESPONSIVE**.
- **MED** - `src/components/MapNodeView.tsx:107`, `whitespace-nowrap`: tooltip has no max-width/wrapping breakpoint and is positioned `top-full`; it can leak horizontally on narrow map nodes. Recommended action: **ADD-BREAKPOINT**.
- **MED** - `src/scenes/PostGig.tsx:73`, `overflow-visible sm:overflow-y-auto`: mobile is the only breakpoint without the internal scroll container. Recommended action: **WIRE-RESPONSIVE**.
- **LOW** - `src/scenes/mainmenu/MainMenuFeatures.tsx:127`, `whitespace-nowrap`: row-key cells have no `sm:`/`md:`/`lg:` override and force horizontal scroll in the feature tables. Recommended action: **ADD-BREAKPOINT**.
- **LOW** - `src/overworld.css:1438`, `.map-wrap height: clamp(420px, 58svh, 620px)`: small phones get a hard 420px map before HUD/log/menu, which can dominate the scroll stack. Recommended action: **NORMALIZE-SCALE**.

## 3. Sizing & Spacing Inconsistency

- **HIGH** - `src/components/MinigameSceneFrame.tsx:138`, `z-500`: class bypasses tokenized z-index and likely does not match Tailwind's generated scale. Recommended action: **NORMALIZE-SCALE**.
- **MED** - `src/overworld.css:475`, `.map-wrap border-radius: 8px`: map shell violates the no-rounded brutalist convention. Recommended action: **NORMALIZE-SCALE**.
- **MED** - `src/scenes/Overworld.tsx:171`, radio widget `rounded`: scene-level radio chrome uses rounded corners and glow shadow. Recommended action: **NORMALIZE-SCALE**.
- **MED** - `src/components/postGig/CompletePhase.tsx:40`, `rounded`: post-gig complete card uses rounded corners. Recommended action: **NORMALIZE-SCALE**.
- **MED** - `src/components/postGig/ZealotryGauge.tsx:16`, `rounded`: zealotry gauge container, thumbnail, and progress rail use rounded corners. Recommended action: **NORMALIZE-SCALE**.
- **MED** - `src/components/postGig/SocialOptionButton.tsx:51`, nested `rounded` panels: card content creates rounded panel-in-card styling. Recommended action: **NORMALIZE-SCALE**.
- **MED** - `src/components/minigames/amp/AmpControls.tsx:102`, fine-tune buttons `rounded`: also at line 134. Recommended action: **NORMALIZE-SCALE**.
- **MED** - `src/components/minigames/roadie/RoadieControls.tsx:137`, D-pad buttons `rounded`: repeated at lines 146, 154, 162. Recommended action: **NORMALIZE-SCALE**.
- **MED** - `src/scenes/kabelsalat/components/Header.tsx:21`, `rounded-t-sm`: scene header violates the no-rounded rule. Recommended action: **NORMALIZE-SCALE**.
- **MED** - `src/overworld.css:1442`, `.map-wrap border-width: 3px`: brutalist border scale is documented as `border-2` or `border-4`; 3px is drift. Recommended action: **NORMALIZE-SCALE**.
- **MED** - `src/overworld.css:118`, `.ow-panel border: 1px`: Overworld panel chrome mixes 1px, 2px, 3px, and 4px borders in the same scene. Recommended action: **NORMALIZE-SCALE**.
- **MED** - `src/components/pregig/PreGigStartButton.tsx:21`, `shadow-[4px_4px_...] hover:shadow-[6px_6px_...]`: hard-shadow offsets diverge from other action buttons and hover changes resize the visual offset. Recommended action: **NORMALIZE-SCALE**.
- **LOW** - `src/components/ChatterOverlay.tsx:137`, `text-[10px] tracking-[0.18em]`: arbitrary font size/tracking values bypass the type scale; similar patterns are widespread in HUD/PostGig/MapNodeView. Recommended action: **NORMALIZE-SCALE**.
- **LOW** - `src/components/pregig/PreGigStartButton.tsx:25`, `RazorPlayIcon w-8 h-8`: icon sizing drifts across `RazorPlayIcon` usages (`ToggleRadio.tsx:48` uses `w-5 h-5`), and skull icons use `w-24`/`w-32`. Recommended action: **NORMALIZE-SCALE**.

## 4. Tailwind v4 / Token Syntax Violations

- **HIGH** - `src/scenes/PreGig.tsx:58`, `bg-(--color-toxic-green) text-(--color-void-black)`: color tokens should use native v4 classes such as `bg-toxic-green text-void-black`. Also line 66. Recommended action: **REPLACE-WITH-TOKEN**.
- **HIGH** - `src/components/pregig/MerchStrategyBlock.tsx:46`, `bg-(--color-charcoal-gray) border-(--color-concrete-gray)`: color-variable arbitrary syntax is used throughout this file. Recommended action: **REPLACE-WITH-TOKEN**.
- **MED** - `src/components/pregig/MerchStrategyBlock.tsx:66`, `hover:bg-(--color-steel-gray) text-(--color-toxic-green)`: hover and text colors use old variable syntax. Recommended action: **REPLACE-WITH-TOKEN**.
- **MED** - `src/components/pregig/MerchStrategyBlock.tsx:93`, `bg-(--color-toxic-green) text-(--color-void-black)`: primary restock button uses old syntax. Recommended action: **REPLACE-WITH-TOKEN**.
- **MED** - `src/components/pregig/MerchStrategyBlock.tsx:199`, `bg-(--color-void-black) border-(--color-toxic-green)`: block shell uses old syntax. Recommended action: **REPLACE-WITH-TOKEN**.
- **MED** - `src/scenes/IntroVideo.tsx:67`, `z-[100]`: hardcoded arbitrary z-index should map to a `--z-*` token. Recommended action: **NORMALIZE-SCALE**.
- **MED** - `src/components/overworld/TravelingVan.tsx:19`, `z-[60]`: hardcoded arbitrary z-index should map to `z-(--z-chatter)`/scene token or a new token. Recommended action: **NORMALIZE-SCALE**.

## 5. Cross-Platform / Device Gaps

- **HIGH** - `src/overworld.css:36`, `animation: scan-overworld ...`: Overworld defines many animations but no `@media (prefers-reduced-motion: reduce)` block for them. Recommended action: **WIRE-RESPONSIVE**.
- **MED** - `src/index.css:916`, reduced-motion block: only `.animate-chromatic-flicker`, `.animate-grain`, and `.animate-scan-bar` are disabled; `.crt-overlay`, `.scene-enter`, `.animate-credits-scroll`, `.animate-pulse-glow`, `.animate-doom-zoom`, `.animate-neon-flicker`, and others remain animated. Recommended action: **WIRE-RESPONSIVE**.
- **MED** - `src/scenes/MainMenu.tsx:109`, `AnimatedSubtitle letterSpacing` animation: Framer Motion scene entrance has no reduced-motion branch. Recommended action: **WIRE-RESPONSIVE**.
- **MED** - `src/scenes/Credits.tsx:72`, `animate-credits-scroll`: 20s scrolling text remains animated under reduced-motion. Recommended action: **WIRE-RESPONSIVE**.
- **MED** - `src/components/ReloadPrompt.css:2`, `.ReloadPrompt-container bottom/right: 20px`: fixed toast ignores safe-area insets. Recommended action: **WIRE-RESPONSIVE**.
- **MED** - `src/components/ReloadPrompt.tsx:44`, `.ReloadPrompt-toast-button px-3 py-1`: update/dismiss buttons have no min-height and can fall below 44px. Recommended action: **NORMALIZE-SCALE**.
- **LOW** - `src/scenes/intro/components/SkipButton.tsx:12`, `bottom-8 right-8`: skip control does not account for safe-area insets. Recommended action: **WIRE-RESPONSIVE**.
- **LOW** - `src/components/minigames/roadie/RoadieControls.tsx:126`, mobile hint `bottom-5`: bottom-fixed mobile hint has no safe-area inset. Recommended action: **WIRE-RESPONSIVE**.

## 6. Consistency Across Scenes

- **MED** - `src/components/pregig/PreGigStartButton.tsx:21`, `src/components/postGig/CompletePhase.tsx:108`, `src/scenes/gameover/GameOverButtons.tsx:23`: primary/continue/recovery buttons use divergent primitives, heights, shadows, and border treatments. Recommended action: **NORMALIZE-SCALE**.
- **MED** - `src/components/assets/RepairConfirmModal.tsx:69`, asset modal buttons: asset modals hand-style confirm/cancel buttons instead of sharing `ActionButton`/`GlitchButton`, diverging from PostGig and GameOver. Recommended action: **NORMALIZE-SCALE**.
- **MED** - `src/overworld.css:1682`, `.ow-backdrop`/`.ow-modal`: legacy Overworld modal chrome differs from current asset/shared modal chrome and uses raw z-index plus `vh`. Recommended action: **NORMALIZE-SCALE**.
- **MED** - `src/components/ReloadPrompt.tsx:31`, `.ReloadPrompt-toast`: toast chrome has no hard shadow and smaller action buttons than other modal/toast-like surfaces. Recommended action: **NORMALIZE-SCALE**.
- **MED** - `src/components/postGig/FinancialList.tsx:26`, `getFinancialColors(type).text`: financial amount colors differ by scene; Overworld money uses warning-yellow/low red, PostGig uses income/expense colors, and asset status uses good/danger. Recommended action: **NORMALIZE-SCALE**.
- **MED** - `src/scenes/ClinicScene.tsx:22`, `src/scenes/MainMenu.tsx:46`, `src/scenes/PostGig.tsx:60`, `src/scenes/Overworld.tsx:162`: scene roots each define their own padding/scroll/alignment shell instead of a common scene container scale. Recommended action: **NORMALIZE-SCALE**.
- **LOW** - `src/components/hud/PauseButton.tsx:24`, `src/components/ToggleRadio.tsx:41`: icon buttons differ in size, border width, touch behavior, and hover styling. Recommended action: **NORMALIZE-SCALE**.

## 7. Dead / Unreachable Styles

- **MED** - `src/overworld.css:2`, `.crt`: selector has no usage outside `src/overworld.css`. Recommended action: **REMOVE-HARDCODE**.
- **MED** - `src/overworld.css:1021`, `.ow-gbtn`: legacy Overworld button selector group appears unused; current UI uses `GlitchButton`/shared buttons. Recommended action: **REMOVE-HARDCODE**.
- **LOW** - `src/index.css:168`, `.text-toxic`, `.text-blood`, `.bg-void`: global utility aliases have zero exact class usages outside `index.css`. Recommended action: **REMOVE-HARDCODE**.
- **LOW** - `src/overworld.css:480`, `.map-svg` and `.map-terrain`: no usage outside the CSS file. Recommended action: **REMOVE-HARDCODE**.
- **LOW** - `src/overworld.css:523`, `.hex-crosshair`: old map-node crosshair selector is unused by the current `MapNodeView` implementation. Recommended action: **REMOVE-HARDCODE**.
- **LOW** - `src/overworld.css:1101`, `.ow-rich-tip` and `.ow-rt-*`: tooltip selector group has no usage outside CSS. Recommended action: **REMOVE-HARDCODE**.
- **LOW** - `src/overworld.css:1591`, `.ow-quest-*`, `.ow-stash-*`, `.ow-refuel-*`: modal-depth selector group has no usage outside CSS. Recommended action: **REMOVE-HARDCODE**.

## Appendix A: Token Inventory

Usage count is literal grep-style occurrence count outside `src/index.css`; native Tailwind class usage like `bg-void-black` is not counted as a `--color-void-black` literal.

| Variable                        | Defined | Grep usage outside index.css |
| ------------------------------- | ------: | ---------------------------: |
| `--color-toxic-green`           |      17 |                          213 |
| `--color-toxic-green-rgb`       |      18 |                           30 |
| `--color-toxic-green-dark`      |      19 |                            0 |
| `--color-toxic-green-light`     |      20 |                            0 |
| `--color-toxic-green-bright`    |      22 |                            0 |
| `--color-toxic-green-mutated`   |      23 |                            0 |
| `--color-toxic-green-glow`      |      24 |                            6 |
| `--color-toxic-green-50`        |      25 |                            1 |
| `--color-toxic-green-20`        |      26 |                           17 |
| `--color-toxic-green-10`        |      27 |                            6 |
| `--color-toxic-green-5`         |      28 |                            2 |
| `--color-void-black`            |      33 |                          102 |
| `--color-void-black-50`         |      34 |                            2 |
| `--color-void-black-rgb`        |      36 |                           26 |
| `--color-hotspot-bg`            |      40 |                            5 |
| `--color-shadow-black`          |      41 |                           12 |
| `--color-concrete-gray`         |      42 |                           10 |
| `--color-ash-gray`              |      43 |                           65 |
| `--color-ash-gray-rgb`          |      44 |                           13 |
| `--color-abyss-black`           |      46 |                            0 |
| `--color-charcoal-gray`         |      47 |                            1 |
| `--color-steel-gray`            |      48 |                            3 |
| `--color-blood-red`             |      53 |                           60 |
| `--color-blood-red-rgb`         |      54 |                            4 |
| `--color-blood-red-bright`      |      55 |                            3 |
| `--color-blood-red-dark`        |      57 |                            0 |
| `--color-blood-red-glow`        |      58 |                            0 |
| `--color-blood-red-20`          |      59 |                            3 |
| `--color-rust-orange`           |      61 |                            0 |
| `--color-rust-orange-bright`    |      63 |                            0 |
| `--color-warning-yellow`        |      65 |                           44 |
| `--color-warning-yellow-rgb`    |      66 |                            5 |
| `--color-warning-yellow-50`     |      67 |                            0 |
| `--color-warning-yellow-30`     |      68 |                            0 |
| `--color-warning-yellow-20`     |      69 |                            1 |
| `--color-rhythm-guitar`         |      72 |                            0 |
| `--color-rhythm-drums`          |      73 |                            0 |
| `--color-rhythm-bass`           |      74 |                            0 |
| `--color-cosmic-purple`         |      79 |                            5 |
| `--color-void-purple`           |      80 |                            0 |
| `--color-void-blue`             |      81 |                            0 |
| `--color-star-white`            |      82 |                           32 |
| `--color-star-white-rgb`        |      83 |                           10 |
| `--color-neon-cyan`             |      85 |                            3 |
| `--color-cosmic-purple-glow`    |      86 |                            0 |
| `--color-purple-glow`           |      87 |                            0 |
| `--color-electric-blue`         |      92 |                           13 |
| `--color-electric-blue-20`      |      93 |                            3 |
| `--color-electric-blue-10`      |      94 |                            2 |
| `--color-hot-pink`              |      95 |                            0 |
| `--color-alert-amber`           |      96 |                            1 |
| `--color-success-green`         |     101 |                            6 |
| `--color-error-red`             |     102 |                            1 |
| `--color-warning-orange`        |     103 |                            0 |
| `--color-info-blue`             |     104 |                            2 |
| `--color-fuel-yellow`           |     106 |                            0 |
| `--color-condition-blue`        |     107 |                            2 |
| `--color-stamina-green`         |     108 |                            0 |
| `--color-mood-pink`             |     109 |                            1 |
| `--color-roadie-grass`          |     111 |                            0 |
| `--color-roadie-venue-blue`     |     112 |                            0 |
| `--color-panel-bg`              |     117 |                            0 |
| `--color-disabled-bg`           |     118 |                            0 |
| `--color-disabled-text`         |     119 |                            0 |
| `--color-disabled-border`       |     120 |                            0 |
| `--color-shadow-overlay`        |     121 |                            1 |
| `--color-shadow-overlay-strong` |     122 |                            0 |
| `--color-overlay`               |     123 |                            0 |
| `--font-display`                |     128 |                            0 |
| `--font-ui`                     |     129 |                            0 |
| `--font-code`                   |     130 |                            0 |
| `--font-script`                 |     131 |                            0 |
| `--font-asset-display`          |     132 |                            1 |
| `--font-asset-control`          |     133 |                            1 |
| `--z-stage-bg`                  |     135 |                            4 |
| `--z-stage`                     |     136 |                           17 |
| `--z-stage-overlay`             |     137 |                            6 |
| `--z-stage-controls`            |     138 |                            3 |
| `--z-hud`                       |     139 |                            1 |
| `--z-modal`                     |     140 |                            3 |
| `--z-tutorial`                  |     141 |                            1 |
| `--z-chatter-mobile`            |     142 |                            1 |
| `--z-chatter`                   |     143 |                            3 |
| `--z-crt`                       |     144 |                            1 |
| `--z-debug`                     |     145 |                            1 |
| `--z-toast`                     |     146 |                            2 |
| `--z-crash`                     |     147 |                            1 |

## Appendix B: Hardcoded-Color Index

Sanctioned files excluded: `src/index.css` and `src/utils/brandColors.ts`. `rgb(var(--...))` usages were treated as tokenized and excluded.

| File:line                                     | Literal    | Kind            | Line                                                               |
| --------------------------------------------- | ---------- | --------------- | ------------------------------------------------------------------ |
| `src/components/stage/stageRenderUtils.ts:45` | `#ffffff`  | hex             | `defaultHexFallback = '#ffffff'`                                   |
| `src/components/stage/stageRenderUtils.ts:59` | `'ffffff'` | bare hex string | `return colorCache.get(cacheKey) ?? Number.parseInt('ffffff', 16)` |
