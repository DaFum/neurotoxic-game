# Long-Term Assets Mobile Hub Redesign - Design Spec

**Date:** 2026-05-26  
**Status:** Approved direction, written spec  
**Design direction:** Roadcase Command Deck with maintenance-log discipline and zine/atlas visual energy

## Goal

Redesign the Long-Term Asset System UI as a mobile-first hub for 360-430px portrait screens. The user should be able to inspect assets, understand cashflow risk, compare installed modules, and take the next useful action with one hand.

The redesign keeps the existing four asset sections and tab model, but changes the hierarchy:

1. Full asset art remains the first visual anchor.
2. A compact slot/action list becomes the reliable management surface.
3. Tabs move into a bottom segmented switcher on mobile.
4. Desktop adapts from the mobile hierarchy instead of using a separate desktop-first design.

## Scope

In scope:

- Redesign `AssetsScene` and the shared long-term asset hub chrome.
- Polish the four existing sections: Tourbus, Studio, Bandhaus, Merch Workshop.
- Keep current section tabs and preserve tab/tabpanel accessibility ids.
- Add or adapt shared UI components for the mobile-first shell, bottom tabs, asset art hero, and slot/action list.
- Improve mobile behavior for purchase, module install, repair, upgrade, liabilities, and crowdfunding entry points.
- Apply a distinctive visual language using existing design tokens and CSS variables.
- Keep all user-facing text localized in EN and DE.
- Validate mobile portrait and desktop adaptation.

Out of scope:

- Changing asset economy rules, module catalogs, reducers, or unlock logic unless a UI bug exposes an existing invalid state.
- Replacing the existing generated-image pipeline.
- Adding new npm dependencies without separate approval.
- Reworking unrelated scenes outside the asset hub.
- Implementing a marketing-style landing page or tutorial overlay.

## Product Principles

### Mobile First

The phone portrait layout is the source of truth. Desktop may gain columns and more visible metadata, but it must not introduce a different information architecture.

Target viewport: 360-430px wide, portrait. Primary tap targets should be thumb-friendly, with no critical action trapped in small artwork hotspots.

### Art First, Control List Second

The generated asset artwork should sell the fantasy of owning a van, studio, bandhaus, or merch workshop. The slot/action list should do the management work reliably.

Hotspots stay useful for discovery and direct manipulation, but every meaningful slot action must also be reachable from the compact list below the art.

### Bottom Tabs Stay

The existing section tabs remain the primary navigation, but mobile presents them as a bottom segmented bar. The bar should feel like hardware controls on a roadcase or crew PDA, not like generic app navigation.

Desktop can keep a wider segmented strip if it fits the layout, but it should share the same component and active-state model.

### Distinctive, Not Generic

The aesthetic should feel built for a grimy band logistics game:

- roadcase hardware, warning tape, risograph texture, xerox zine blocks;
- sharp contrast and section accents;
- compact controls that feel like crew labels and maintenance tags;
- no white-card SaaS dashboard patterns;
- no generic Inter/Roboto/Arial/system-font look;
- no purple-gradient-on-white default AI styling.

## Visual System

### Typography

Use CSS variables for the new asset hub type system:

- `--asset-font-display`: a distinctive condensed/display face for section titles and large status labels. Preferred direction: `Staatliches`.
- `--asset-font-control`: a technical mono/control face for buttons, slot labels, amounts, and compact metadata. Preferred direction: `Azeret Mono`.

Implementation should avoid adding package dependencies. If font loading is done through CSS, keep it isolated to the asset hub stylesheet or global token layer. If external font loading is not acceptable for the project, map these variables to the closest existing project fonts while preserving the display/control contrast.

### Color And Tokens

Use existing CSS variables and section accent overrides. Do not hardcode hex colors in components.

Base mood:

- dark roadcase surface;
- high-contrast text;
- toxic green for active/ready states;
- warning yellow for risk/cost pressure;
- electric blue or section-specific accents for selected states;
- muted danger token for foreclosure, locked, or broken states.

Each section continues to expose `--section-accent` at the scene or section root. Shared components read that variable instead of receiving accent colors through props.

### Backgrounds And Texture

The hub background should have atmosphere without visual clutter:

- layered CSS gradients using project tokens;
- subtle diagonal tape or dot-screen pattern;
- low-opacity panel scratches/noise where supported by CSS;
- no decorative blobs, orbs, or unrelated abstract shapes.

The asset art panel should remain the loudest visual element in the first viewport. Page chrome should frame it, not compete with it.

### Motion

Use CSS-first motion:

- staggered reveal when switching sections: top strip, art panel, slot list, bottom actions;
- short press/active feedback on bottom tabs and slot action buttons;
- reduced-motion support via `prefers-reduced-motion`;
- no animation that delays core actions or makes scroll feel heavy.

## Information Architecture

### Mobile Layout

Each section renders in this order:

1. Compact status strip.
2. Asset art hero.
3. Context action row.
4. Slot/action list.
5. Secondary finance/workflow panels.
6. Bottom segmented tab bar.

The bottom tab bar is sticky to the viewport bottom and accounts for safe-area inset. It must not cover primary actions or list rows.

### Desktop Layout

Desktop adapts from the same content:

- status strip remains at the top;
- art hero and slot/action list can become a two-column deck;
- secondary finance panels sit beside or below the main deck depending on available width;
- bottom tabs can become a lower dock or compact horizontal segmented strip, but tab semantics stay identical.

## Components

### `AssetsScene`

Owns the overall hub layout:

- renders the asset status strip;
- renders the active section panel;
- renders the responsive tab switcher;
- preserves existing `assets-tab-${kind}` and `assets-panel-${kind}` ids;
- keeps the section registry pattern.

It should continue to use selectors such as `getTotalDailyObligations` and `getTotalDebt` rather than recomputing aggregate financials inline.

### `AssetsStatusStrip`

Compact financial strip replacing the current top-heavy mobile header.

Shows:

- cash;
- daily obligations or net daily pressure;
- total debt;
- active crowdfunding count or risk indicator when relevant.

On phone portrait, it should fit in one horizontal scan line or a tight two-row grid. Labels should be short and localized.

### `AssetsBottomTabs`

Responsive segmented section switcher.

Requirements:

- 4 tabs: Tourbus, Studio, Bandhaus, Workshop;
- icon plus label where space allows;
- label remains available to screen readers when visually compact;
- 44px minimum tap height;
- active state uses `--section-accent`;
- keyboard navigation remains possible;
- optional swipe gestures can switch sections, but tabs remain the accessible source of truth.

### `AssetSectionDeck`

Shared section shell that arranges the hero art, primary actions, slot list, and secondary panels.

Responsibilities:

- apply section accent;
- manage responsive layout;
- keep spacing predictable at 360px width;
- expose stable regions for tests and screenshots.

### `AssetHeroPanel`

Wraps the existing generated section view or asset artwork.

Responsibilities:

- keep current `GeneratedImagePanel` behavior and fallbacks;
- preserve existing hotspot interactions;
- provide localized alt text;
- display condition, tier, flavor, and acquisition mode as compact overlays;
- avoid overlays that block important artwork or slot hotspots.

The hero should be full-width on mobile. Aspect ratios can remain section-specific, but the layout must prevent the 21:9 workshop view from becoming too short to understand on phone screens. If needed, the workshop hero may use a taller framed crop on mobile while preserving the generated image.

### `AssetSlotActionList`

The core mobile management surface.

Each row represents one slot and shows:

- slot label;
- installed module name or empty/locked state;
- compact benefit, condition, conflict, or unlock summary;
- one primary action button: install, swap, repair, inspect, or locked;
- accessible name that includes the installed module name when present.

Rows should be dense but not cramped. They should look like labeled hardware strips or maintenance log entries, not generic cards.

### `AssetContextActions`

Small action row below the hero:

- buy/acquire when no asset exists;
- upgrade when eligible;
- repair when condition is low;
- sell or inspect debt/crowdfund details as secondary actions.

Only one primary action should dominate at a time.

### Existing Modals

The redesign should reuse current modals where practical, but mobile presentation should feel like bottom sheets:

- `ModulePickerModal`;
- `ChassisAcquisitionModal`;
- liabilities/debt panels;
- crowdfunding panels.

The modals should remain section-agnostic. Shared modals read section accent through CSS variables rather than new color props.

## Section Behavior

### Tourbus

Hero: vehicle side view with hotspots.  
Slot list: emphasizes travel readiness, fuel impact, merch capacity, and condition.

Primary mobile action priority:

1. repair if condition is critical;
2. install or swap module;
3. upgrade chassis;
4. inspect financing.

### Studio

Hero: floorplan view.  
Slot list: emphasizes song quality, recording cost, vibe, and unlocked production capabilities.

The floorplan hotspots remain useful, but the list should make control/outboard/mic/monitoring slots easy to compare without precise tapping.

### Bandhaus

Hero: cross-section view.  
Slot list: emphasizes stamina recovery, mood, risk, and passive revenue.

The layout should avoid making the tall artwork consume the entire phone viewport. Show enough of the first slot row below the hero to signal that management continues downward.

### Merch Workshop

Hero: production line view.  
Slot list: emphasizes print/drying/cutting/packaging/storage/sales flow.

Because the workshop art is wide, the mobile hero should prioritize readability over preserving a tiny panoramic strip. The slot list carries the reliable one-handed workflow.

## Data Flow

The redesign should not introduce new domain state. It should derive UI state from existing asset data, selectors, and action creators.

Expected flow:

1. `AssetsScene` determines active section.
2. Section component selects the relevant asset, module registry data, lock states, liabilities, and crowdfunding status.
3. `AssetSectionDeck` receives display-ready section data and callbacks.
4. `AssetHeroPanel` renders current visual section view and hotspot callbacks.
5. `AssetSlotActionList` renders slot rows from the same asset data.
6. Actions continue through existing action creators and reducers.

Where data is missing or invalid, the UI shows a localized empty, locked, or unavailable state rather than guessing.

## Accessibility

Requirements:

- Preserve tab/tabpanel semantics and ids.
- Bottom tabs must be keyboard reachable and screen-reader understandable.
- Slot row action names must include installed module names when present.
- Image alt text must be localized.
- Hotspot buttons must not rely on image `alt` text for installed module identification.
- Focus should move predictably when opening and closing modals.
- Minimum tap target height is 44px for tabs and primary row actions.
- Color cannot be the only signal for locked, damaged, selected, or risky states.
- Reduced-motion users get instant or near-instant state changes.

## I18n

All new visible text uses the existing `assets` namespace. EN and DE locale files must be updated together.

Likely new key groups:

- `assets:hub.status.*`
- `assets:hub.tabs.*`
- `assets:hub.actions.*`
- `assets:hub.slotState.*`
- `assets:hub.finance.*`
- `assets:hub.accessibility.*`
- `assets:section.<section>.alt`

Existing module, slot, chassis, and action keys should be reused before adding new keys.

## Error Handling And Empty States

### No Asset Owned

Show:

- section-specific generated art or acquisition preview;
- concise localized empty-state copy;
- one primary acquire action;
- financing/crowdfunding hints only if available.

### Image Failure

Use the existing `GeneratedImagePanel` fallback behavior. The layout must remain stable while images load or fail.

### Locked Or Unavailable Actions

Locked rows show a short localized reason. Disabled controls should remain understandable to screen readers.

### Financial Pressure

If cash, debt, daily obligations, or crowdfunding risk creates pressure, surface it in the status strip and relevant action rows. Do not block actions in the UI unless the underlying action creator/reducer would reject them.

## Testing And Validation

### Unit And Component Tests

Add or update Vitest coverage for:

- bottom tab rendering and section switching;
- preserved tab/tabpanel ids;
- slot rows for installed, empty, locked, and damaged states;
- accessible names including installed module names;
- no-asset empty states;
- localized alt text usage;
- modal open callbacks from both hotspot and slot list paths.

React i18n mocks must include `initReactI18next`.

### Visual And Browser Validation

After implementation, run the app and verify:

- 390x844 phone portrait;
- 360x800 narrow phone portrait;
- 430x932 larger phone portrait;
- desktop width.

Check:

- no text overlap;
- bottom tabs do not cover content;
- tap targets are large enough;
- generated images render or fall back cleanly;
- section switching is not visually blank;
- desktop layout still feels adapted from the mobile deck.

### Existing Regression Gates

Run the focused UI tests first, then the project's normal test/type gates selected for the final implementation scope.

## Implementation Boundaries

Keep changes minimal and UI-focused:

- prefer shared shell/list components over duplicating four section layouts;
- do not refactor reducers or selectors unless required by a verified UI integration issue;
- do not add dependencies for swipe, animation, or fonts without discussion;
- do not replace `GeneratedImagePanel`;
- do not hardcode colors;
- do not introduce non-localized visible text.

## Acceptance Criteria

The redesign is complete when:

- phone portrait presents status, art, slot actions, and bottom tabs without horizontal scrolling;
- every slot can be managed through the list without relying on artwork hotspots;
- each section keeps its visual identity;
- desktop layout remains usable and consistent with mobile hierarchy;
- EN and DE locale files are aligned for new keys;
- accessibility requirements above are met;
- focused tests and agreed validation commands pass.
