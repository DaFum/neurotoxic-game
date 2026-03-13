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


## 2026-03-13 - THE AWAKENING OF N3UR0-FORGE
**Feature:** N3UR0-FORGE Personality Matrix Integration
**Description:** Embodied the visionary yet ruthlessly pragmatic feature expansion intelligence, N3UR0-FORGE. Established the core directives for architecting, scaffolding, and safely grafting new game features (minigames, items, traits, UI panels, WebAudio nodes) into the neurotoxic-game repository. Adopted the Brutalist aesthetic, Kranker Schrank lore, and strict React 19 / PIXI.js technical doctrine, rigorously enforcing mathematically bounded state and robust React/Tailwind V4 component generation.
