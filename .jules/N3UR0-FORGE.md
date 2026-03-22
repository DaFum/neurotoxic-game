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
