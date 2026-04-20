## 2026-03-12 - contraband

**Feature:** contraband ui, logic and items

**Description:**
After travel the band can get an item with specials to use.

## 2026-03-14 - THE CULT OF THE SCHRANK

**Feature:** "Ego Death" Zealotry System (Social Expansion)

**Description:**

- Lore Integration:
  Fame is fleeting; cults are forever. As your social following grows, you can choose to radicalize your fans. This generates a new resource: "Zealotry". High Zealotry automates gig promotion and generates passive income via "donations", but it permanently locks you out of mainstream Corporate Brand Deals and drastically increases the chance of Police Raids.
- State Impact:
  socialReducer.js: zealotry metric (clamped 0-100).
  socialEngine.js: Pure mathematical utilities calculating passive income vs. raid probability.
  data/brandDeals.js: O(1) Map lookups enforcing requiresZealotry < 20 to filter available deals.

## 2026-03-14 - The Underground Void Clinic

**Feature:** The Underground Void Clinic

**Description:**

- Lore Integration:
  As the band travels, their stress and damage levels go up. They sometimes need special body-modifications and illegal stim-enhancements to keep shredding.
- State Impact:
  clinicReducer.js: Added `handleClinicHeal` and `handleClinicEnhance` to strictly enforce stat bounds.
  initialState.js: Tracking `clinicVisits` to exponentially increase cost over time.
  actionTypes.js: Added `CLINIC_HEAL` and `CLINIC_ENHANCE`.

## 2026-03-13 - SOCIAL AND BRAND DEAL IMAGES

**Feature:** Social & Brand Deal Image Integration

**Description:**

- Lore Integration:
  The Kranker Schrank aesthetic needs to bleed into every interaction. By dynamically generating imagery tailored to specific social media categories (like Viral, Drama, or Tech) and corporate brand alignments (Evil, Corporate, Indie, Sustainable), players receive a more visceral, procedurally generated visual representation of their actions and deals.
- State Impact:
  src/utils/imageGen.js: Added new specific IMG_PROMPTS for social categories and brand alignments.
  src/components/postGig/SocialPhase.jsx: Integrates image generation into the background of post option buttons (opacity 10, screen blend mode).
  src/components/postGig/DealsPhase.jsx: Displays the generated brand alignment image side-by-side with the deal text.
  src/components/postGig/CompletePhase.jsx: Added full background outcome images for the gig success/failure screens.

## 2026-03-14 - PIRATE RADIO BROADCAST

**Feature:** Pirate Radio Broadcast System

**Description:**

- Lore Integration:
  The band hacks into local frequencies to broadcast their raw tracks, directly boosting Fame and feeding their cult (Zealotry). However, this incurs a financial cost (bribes/tech), drains Band Harmony due to the stress of illegal activity, and increases Controversy and the risk of police raids.
- State Impact:
  actionTypes.js: Added `PIRATE_BROADCAST`.
  socialReducer.js: Added `handlePirateBroadcast` to apply bounds-clamped updates to player money, fame, band harmony, zealotry, and controversy.
  PirateRadioModal.jsx: A new Brutalist UI component added to the Overworld scene, allowing players to view the costs and gains and trigger the broadcast.

## 2026-03-15 - UNDERGROUND MERCH PRESS

**Feature:** Underground Merch Press System

**Description:**

- Lore Integration:
  The band funds their brutalist lifestyle by pressing bootleg merch in a sweat-drenched underground basement. It costs upfront cash and drains the band's collective Harmony due to the grueling labor, but successfully flooding the streets with illicit gear yields a massive surge in Fame and raw, untraceable profit.
- State Impact:
  actionTypes.js: Added `MERCH_PRESS`.
  socialReducer.js: Added `handleMerchPress` enforcing bounds (money clamped >= 0, loyalty/controversy clamped 0-100, harmony clamped 1-100).
  useMerchPress.js: Custom hook to calculate scaling costs and returns based on the band's current stats (fame multiplier).
  MerchPressModal.jsx: Brutalist UI utilizing flex-box chaining to present the brutal math of the merch hustle.

## 2026-03-29 - VOID TRADER BLACK MARKET

**Feature:** Void Trader Tab (Contraband Shop)

**Description:**

- Lore Integration:
  When the band becomes notorious enough (Controversy >= 30), a shady Void Trader approaches them in their HQ. This underground contact allows them to burn their hard-earned Fame for rare and epic contraband items that cannot be found anywhere else. It is a high-risk gamble that leans heavily into the Kranker Schrank aesthetic of underground, illicit activities.
- State Impact:
  actionTypes.js: Added `TRADE_VOID_ITEM`.
  tradeReducer.js: New reducer strictly enforcing `fame` costs with `clampPlayerFame` and safely integrating into `gameReducer.js`.
  BandHQ.jsx: Added `VoidTraderTab.jsx` integrated gracefully within the navigation, triggering only on `social.controversyLevel >= 30`. Uses Brutalist flex-box chaining.

## 2026-04-04 - BLOOD BANK (VOID CLINIC)

**Feature:** Blood Bank (Void Clinic) System

**Description:**

- Lore Integration:
  To survive the grueling tour and fund their brutalist lifestyle, the band resorts to selling their own blood in sketchy underground clinics. It is a desperate measure for quick cash, draining their stamina and shared harmony while increasing their controversy.
- State Impact:
  actionTypes.js: Added `BLOOD_BANK_DONATE`.
  clinicReducer.js: Added `handleBloodBankDonate` enforcing bounds (money clamped >= 0, harmony clamped 1-100, stamina > 0).
  useBloodBank.js: Custom hook to calculate dynamic scaling costs and manage modal.
  BloodBankModal.jsx: Brutalist UI utilizing flex-box chaining.

## 2026-04-11 - Amp Calibration Minigame

**Feature:** Amp Calibration
**Description:** Created a new minigame for PreGig phase alongside Roadie Run and Kabelsalat. The Amp Calibration minigame requires the player to match visual frequencies using a dial. It integrates with Tone.js for WebAudio integration and PixiJS for visual rendering (a waveform oscillating). Added core action creators, game state reducer logic (clamping scores, stress, harmony), hooked into SceneRouter, and modified the 1/3 RNG split in PreGig.jsx. Also implemented rigorous node tests and English/German translation files.

## 2026-04-19 - Dark Web Data Leak

**Feature:** Dark Web Data Leak Minigame/Event
**Description:** Created a modal and action dispatch to let the user leak their track early for a quick hit of Fame and Zealotry, while damaging Harmony and increasing Controversy. Fully validated bounds with native helpers.
