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
