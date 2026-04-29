# Palette's Journal

## 2026-03-14 - Custom Toggle Switch Accessibility

**Learning:** Custom toggle buttons built with generic elements (`<button>` and `<span>`) lack implicit label associations, causing screen readers to announce them merely as "toggle, pressed" without context. This pattern is common in the brutalist UI components.
**Action:** When implementing custom form controls or toggles alongside visual labels, always use `useId()` and link them explicitly via `aria-labelledby` on the interactive element pointing to the `id` of the visual text container.

## 2026-04-10 - Tooltips on Disabled Buttons

**Learning:** React disabled elements (`disabled={true}`) swallow pointer events by default, making hover-based tooltips fail. When wrapping disabled buttons with tooltips to explain their disabled state, do not wrap them in semantically incorrect `<span>` tags just to capture hover. Instead, apply `aria-disabled='true'` and `tabIndex={-1}` to the interactive element, and handle the disabled logical check internally within the element or via the Tooltip component without natively disabling the DOM element, OR ensure the Tooltip component wraps elements intelligently as needed. (In this repo, our custom `Tooltip` component gracefully handles standard disabled buttons and `aria-disabled='true'`).
**Action:** Use `aria-disabled='true'` alongside explicit `Tooltip` components to explain why actions are disabled, avoiding native `disabled={true}` if necessary for hover, but if the component library supports it, avoid extra nested `span` containers. In this codebase, the custom `Tooltip` component detects `aria-disabled` and injects its own hoverable wrapper intelligently, so we can just use `Tooltip` directly around the disabled element without polluting the DOM.

## 2026-04-10 - Merch Press Disabled State

**Learning:** `MerchPressModal` had a generic `<span role="button">` wrapping its disabled button, and its disabled reason was incomplete (only checking `isAffordable`, completely missing `harmonyCostOnFail`).
**Action:** Ensure all constraints for an action are evaluated when presenting the disabled reason (e.g., both funds and harmony).

## 2026-05-24 - Invisible native elements need visible focus proxies

**Learning:** When using visually hidden native inputs (like `<input type="range" className="sr-only">`) to drive custom UI (like volume slider segments), keyboard users lose all focus indicators because the focused element is invisible. Tabbing through the UI leaves the user lost.
**Action:** When hiding a native interactive element (`sr-only`), always use a CSS pseudo-class selector (e.g. Tailwind's `has-[:focus-visible]:ring-2`) on the visible container to act as a proxy focus indicator.

## 2026-05-18 - Adding Weight to Instant Actions

**Learning:** Instant state changes (like purchasing items) can feel trivial or leave users unsure if the action registered. Adding a deliberate loading state with a micro-delay (500ms) provides necessary feedback, confirms the action's significance, and prevents accidental double-clicks.
**Action:** Implement `isLoading` states on primary transactional buttons, even if the underlying logic is synchronous, to enhance perceived value and user confidence.

## 2026-05-18 - Invisible Context for Icon-Only Buttons

**Learning:** Icon-only navigation and control buttons (like the Mute or Help buttons in the HUD) can be ambiguous or completely inaccessible to visually impaired users if they lack aria-labels or visual tooltips, violating WCAG principles.
**Action:** When adding or maintaining icon-only buttons, always wrap them in existing `Tooltip` components (if available) for sighted users and explicitly define descriptive `aria-label`s for screen-reader accessibility.

## 2026-05-19 - Explicit Focus Indicators for Custom Hover States

**Learning:** Relying solely on `hover:` utilities to indicate interactivity can make components completely inaccessible to keyboard users, especially if the default browser focus ring is disabled or insufficient against the background.
**Action:** Whenever introducing custom `hover:` states (like changing background color or border), always explicitly pair them with `focus-visible:` utilities (like `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-color`) to ensure keyboard navigability.

## 2026-05-19 - Keyboard Accessibility for List Items as Buttons

**Learning:** In custom list interfaces (like the song selection list in SetlistTab), utilizing `<button>` elements is great for interactivity, but if they lack `focus-visible` styles, keyboard users cannot track their current selection while tabbing through the list. This breaks navigation for non-mouse users.
**Action:** Always ensure that any interactive list items or toggle buttons contain explicit `focus-visible` outline styles (e.g., `focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-2 focus-visible:ring-offset-void-black`) to clearly demarcate the active keyboard focus.

## 2026-05-19 - Visual Feedback for Disabled Interactive Elements

**Learning:** When interactive elements like ActionButton accept a `disabled` prop but lack visual styling to indicate that state, users may repeatedly attempt to interact with them, assuming a bug when nothing happens. Scaling on hover while disabled further exacerbates this confusion.
**Action:** Always pair `disabled` logic with explicit visual cues (e.g., `disabled:opacity-50 disabled:cursor-not-allowed`) and ensure conflicting interactive styles (like hover scaling) are overridden in the disabled state.

## 2026-04-07 - Focus Rings on Form Inputs

**Learning:** Form controls (e.g., `<input>`, `<textarea>`, `<select>`, `contenteditable`) in this app were often styled with `focus:outline-none` which removed default focus indicators without replacing them, making keyboard navigation inaccessible.
**Action:** Always verify that `focus-visible:ring-2 focus-visible:ring-toxic-green` is applied to form controls when `focus:outline-none` is used on these named elements.

## 2026-04-08 - Empty State Call to Actions

**Learning:** Empty states in modals (like having no active quests) that only provide a text description ("No active quests") can leave users feeling stuck or unsure of how to progress. Adding an explicit Call-to-Action button directly within the empty state transforms a dead-end into a helpful bridge.
**Action:** When designing or updating empty states, always consider if there is a primary action the user should take to resolve the empty state, and provide a clear, actionable button (e.g., "FIND GIGS") to guide them there.

## 2026-04-09 - Focus Indicators on Extracted Components

**Learning:** Interactive elements extracted into their own components (like `SetlistBlock` or `PreGigStartButton`) often lose inherited global focus styles or omit explicit `focus-visible` rings, breaking keyboard navigation flow on critical screens like the Pre-Gig setup.
**Action:** When creating new interactive components or refactoring large UI blocks, ensure explicit `focus-visible` utility classes (e.g., `focus-visible:outline-none focus-visible:ring-2`) are applied to the outermost `button` or interactive container.

## 2026-06-03 - Semantics of Custom Tabs

**Learning:** When using buttons for navigation within a single view (like tabs), visual styling isn't enough for screen readers. Without `role="tab"`, `role="tablist"`, and `aria-selected`, users relying on assistive technology lose context of their location and the relationship between the controls and the content.
**Action:** Always wrap custom tab-like navigation in `role="tablist"` and link tabs to their content panels using `aria-controls` and `aria-labelledby` to create a robust, navigable structure.

## 2026-06-03 - D-Pad Accessibility on Mobile Devices

**Learning:** Icon-only navigation buttons like the Mobile D-Pad (▲, ▼, ◄, ►) must have `aria-label` attributes to be accessible to screen readers, which might misinterpret or ignore the visual text symbols.
**Action:** Add descriptive `aria-label`s such as 'Move Up', 'Move Left', 'Move Down', and 'Move Right' to these buttons.

## 2026-06-04 - Preventing accidental form submissions in interactive buttons

**Learning:** In a heavily componentized brutalist React app where `<button>` elements are often reused in different layout contexts (e.g., `HUD.jsx`, `ToggleRadio.jsx`, `GigModifierButton.jsx`), omitting the `type="button"` attribute leaves them vulnerable to accidentally triggering implicit form submissions if an ancestor component wraps them in a `<form>`. This can lead to unhandled page reloads or broken state.
**Action:** Always explicitly declare `type="button"` on interactive components like toggles, tabs, and action buttons that do not orchestrate data submission.

## 2026-06-05 - Focus rings on interactive inner elements

**Learning:** When components like `GigModifiersBlock` use interactive nested buttons (like "Band Meeting") without explicit `focus-visible` styling, keyboard users lack visual feedback for navigation.
**Action:** When extracting or creating new interactive blocks that use generic HTML `<button>` inside them, always explicitly apply `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-<color> focus-visible:ring-offset-2 focus-visible:ring-offset-void-black` on the button elements.

## 2025-02-18 - Tooltip Container Layout

**Learning:** When conditionally wrapping full-width components (like buttons) in a `Tooltip` component (which defaults to an `inline-block` layout), the wrapper can cause the inner button to shrink unexpectedly. Passing class names from the parent can lead to class conflicts (e.g. `block` vs `inline-block` in Tailwind).
**Action:** Instead of hardcoding layout classes from the parent, the `Tooltip` component should dynamically read the child element`s `className`(using`React.cloneElement`or direct reading) and apply necessary layout properties (like`w-full block`) to both its outer `div`and inner disabled`span` wrappers automatically. This preserves the layout of full-width children safely without duplicate prop passing.

## 2025-02-28 - Tooltip for Locked Songs in Pre-Gig Setlist

**Learning:** Locked items (like songs) in list selections often lack context as to _why_ they are locked, especially when the locking condition is tied to a specific game mode (e.g., 'Prove Yourself' mode). While adding a tooltip directly to a disabled `<button>` is tempting, it often fails accessibility and interaction tests because disabled elements do not trigger mouse or keyboard events reliably across browsers.
**Action:** Pass the disabled control directly into `Tooltip` (e.g., `Tooltip` children) and let `Tooltip` supply the focusable wrapper for disabled elements, rather than manually wrapping controls in a `<span tabIndex={0}>` at call sites. This ensures the reason for the disabled state is accessible without duplicate wrapper logic.

## 2026-06-06 - Missing focus rings in ContrabandStash member target buttons

**Learning:** Target member selection buttons in the ContrabandStash component lacked `aria-pressed`, meaning screen readers couldn't identify the actively selected member button visually represented by active classes. Furthermore, the buttons lacked explicit focus rings.

**Action:** Bound the `aria-pressed` attribute to the boolean expression evaluating if the button's specific state (e.g. `selectedMember === m.id`) is matched to reflect visual state audibly. Also, added explicit `focus-visible` ring utilities to ensure keyboard navigability.

## 2024-04-21 - Mute/Unmute Toggle Button Accessibility

**Learning:** Found that the main volume toggle (Mute/Unmute) button in the HUD was missing the `aria-pressed` attribute, which provides a stable name for the control. Without `aria-pressed`, screen reader users might not know the toggle status of the button immediately.
**Action:** Always ensure that toggle buttons reflect their state using the `aria-pressed` attribute, with a stable accessible `aria-label`.

## 2026-06-07 - Focus Rings on Custom Tabs

**Learning:** When creating custom tab buttons (e.g., in `BrutalTabs` component), users navigating by keyboard often have no visual indicator of which tab is currently focused. Since focus relies heavily on standard states (`focus-visible:` classes), missing these classes leads to a degraded accessibility experience.
**Action:** Ensure all interactive elements, particularly those serving as `role="tab"`, implement explicit `focus-visible:` styles (e.g., `focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-2`) to provide a clear focus ring for keyboard navigation.
