# Palette's Journal

## 2026-03-14 - Custom Toggle Switch Accessibility

**Learning:** Custom toggles built from `<button>` + `<span>` (the pattern used across `src/ui/shared/BrutalistUI.tsx` and `src/components/ToggleRadio.tsx`) have no implicit label association, so screen readers announce only "toggle, pressed" without context.
**Action:** When pairing a custom toggle with a visual label, generate an id with `useId()`, put it on the label span, and reference it via `aria-labelledby` on the interactive element. Also bind `aria-pressed={isActive}` so the toggle state is announced — visual styling alone is not enough.

## 2026-04-10 - Tooltips on Disabled Buttons

**Learning:** Native `disabled` elements swallow pointer events, so hover tooltips fail on them. In this repo, `src/ui/shared/Tooltip.tsx` already detects both `disabled` and `aria-disabled` on its child and injects its own hoverable wrapper.
**Action:** Pass the disabled control directly as a child of `Tooltip` — do not hand-roll a `<span tabIndex={0}>` wrapper at the call site. If you need hover on a control that must remain interactive (e.g. focusable for a reason explanation), prefer `aria-disabled="true"` over native `disabled` and let `Tooltip` do the rest.

## 2026-04-10 - Merch Press Disabled State

**Learning:** `src/ui/MerchPressModal.tsx` originally wrapped its disabled CTA in a generic `<span role="button">` and its `disabledReason` only checked `isAffordable`, ignoring `config.harmonyCostOnFail`. The current implementation evaluates both `(player.money >= config.cost)` and `(band.harmony >= config.harmonyCostOnFail)` before allowing the press.
**Action:** When an action has multiple gating constraints (funds, harmony, fuel, fame, etc.), evaluate all of them when computing `disabledReason` so the Tooltip surfaces the _specific_ blocker. Pass the disabled `<button>` straight to `Tooltip` rather than reintroducing a `<span role="button">` wrapper.

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

**Learning:** In a heavily componentized brutalist React app where `<button>` elements are often reused in different layout contexts (e.g., `HUD.tsx`, `ToggleRadio.tsx`, `GigModifierButton.tsx`), omitting the `type="button"` attribute leaves them vulnerable to accidentally triggering implicit form submissions if an ancestor component wraps them in a `<form>`. This can lead to unhandled page reloads or broken state.
**Action:** Always explicitly declare `type="button"` on interactive components like toggles, tabs, and action buttons that do not orchestrate data submission.

## 2026-06-05 - Focus rings on interactive inner elements

**Learning:** When components like `GigModifiersBlock` use interactive nested buttons (like "Band Meeting") without explicit `focus-visible` styling, keyboard users lack visual feedback for navigation.
**Action:** When extracting or creating new interactive blocks that use generic HTML `<button>` inside them, always explicitly apply `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-<color> focus-visible:ring-offset-2 focus-visible:ring-offset-void-black` on the button elements.

## 2025-02-18 - Tooltip Container Layout

**Learning:** When conditionally wrapping full-width components (like buttons) in a `Tooltip` component (which defaults to an `inline-block` layout), the wrapper can cause the inner button to shrink unexpectedly. Passing class names from the parent can lead to class conflicts (e.g. `block` vs `inline-block` in Tailwind).
**Action:** Instead of hardcoding layout classes from the parent, the `Tooltip` component should dynamically read the child element's `className` (using `React.cloneElement` or direct reading) and apply necessary layout properties (like `w-full block`) to both its outer `div` and inner disabled `span` wrappers automatically. This preserves the layout of full-width children safely without duplicate prop passing.

## 2025-02-28 - Tooltip for Locked Songs in Pre-Gig Setlist

**Learning:** Locked items (like songs) in list selections often lack context as to _why_ they are locked, especially when the locking condition is tied to a specific game mode (e.g., 'Prove Yourself' mode). While adding a tooltip directly to a disabled `<button>` is tempting, it often fails accessibility and interaction tests because disabled elements do not trigger mouse or keyboard events reliably across browsers.
**Action:** Pass the disabled control directly into `Tooltip` (e.g., `Tooltip` children) and let `Tooltip` supply the focusable wrapper for disabled elements, rather than manually wrapping controls in a `<span tabIndex={0}>` at call sites. This ensures the reason for the disabled state is accessible without duplicate wrapper logic.

## 2026-06-06 - Missing focus rings in ContrabandStash member target buttons

**Learning:** Target member selection buttons in the ContrabandStash component lacked `aria-pressed`, meaning screen readers couldn't identify the actively selected member button visually represented by active classes. Furthermore, the buttons lacked explicit focus rings.

**Action:** Bound the `aria-pressed` attribute to the boolean expression evaluating if the button's specific state (e.g. `selectedMember === m.id`) is matched to reflect visual state audibly. Also, added explicit `focus-visible` ring utilities to ensure keyboard navigability.

## 2024-04-21 - Mute/Unmute Toggle Button Accessibility

**Learning:** Found that the main volume toggle (Mute/Unmute) button in the HUD was missing the `aria-pressed` attribute, which provides a stable name for the control. Without `aria-pressed`, screen reader users might not know the toggle status of the button immediately.
**Action:** Always ensure that toggle buttons reflect their state using the `aria-pressed` attribute, with a stable accessible `aria-label`.

## 2024-05-15 - Replace Native Title with Tooltip Component

**Learning:** The native HTML `title` attribute is slow, unstyleable, and inconsistent across browsers/assistive tech. `src/ui/shared/Tooltip.tsx` is the project's canonical replacement and handles `disabled` / `aria-disabled` children, pointer-events inheritance, and i18n strings out of the box.
**Action:** Replace any `title="..."` on interactive or informational elements with `<Tooltip content={t('ui:...')}>...</Tooltip>`. Use the i18n key (never a raw string literal) and update EN + DE locale JSON together per the project's i18n rule.

## 2026-05-03 - HUD Tooltips

**Learning:** Adding `pointer-events-auto` to wrapper elements inside `pointer-events-none` containers is necessary for hover interactions (like tooltips) to work properly.
**Action:** Always check pointer-events inheritance when adding interactive elements or tooltips to HUD components.

## 2026-05-16 - ARIA Toggle State Pattern

**Learning:** Interactive toggle buttons with custom visual states (like the Overdrive button in AmpControls) require `aria-pressed` bound directly to their active state to correctly communicate their toggle status to screen readers, unlike standard buttons which only need an `aria-label`.
**Action:** Always verify if a button behaves as a toggle (changes state on click) and ensure `aria-pressed={isActive}` is present.

## 2024-11-20 - Redundant ARIA Labels

**Learning:** Adding an `aria-label` to a button that already contains the exact same text is a redundant accessibility anti-pattern. Screen readers will read the button's internal text naturally. `aria-label` should be reserved for icon-only buttons or when the visible text does not provide sufficient context.
**Action:** Always check the internal text content of an interactive element before adding an `aria-label`. Only add it if the element is visually lacking descriptive text.

## 2026-05-28 - Tooltips on disabled elements

**Learning:** React native disabled elements do not fire pointer events like onMouseEnter, which means tooltips on standard disabled buttons don't fire without wrappers. The `Tooltip` component handles this automatically by wrapping disabled inputs in a tab/hover friendly \`<span>\`, BUT rendering an empty \`Tooltip\` shell conditionally based on its content (e.g., \`<Tooltip content={undefined}>\`) breaks accessibility. Always conditionally render the _Tooltip component itself_, rather than relying on it to disappear when its content prop is falsy, to ensure native \`aria-labels\` and screen-reader behaviors aren't overridden by ghost wrappers.

## 2025-05-30 - Missing Tooltips for Icon-Only Actions

**Learning:** Icon-only buttons (like the `?` shortcuts toggle in OverworldHUD) often lack visual hover feedback to explain their purpose to sighted users, despite having proper `aria-label`s for screen readers. The `Tooltip` component from `src/ui/shared` is standard practice across the HUD for resolving this.
**Action:** When inspecting or adding icon-only buttons, systematically wrap them in the existing `Tooltip` component, ensuring the `content` string matches or closely aligns with the `aria-label` for consistency across all user types.

## 2024-06-12 - Disabled Button Tooltips

**Learning:** In Tailwind UI, combining `pointer-events-none` with `cursor-not-allowed` on disabled buttons breaks the cursor style and prevents tooltips from showing because the browser ignores all pointer events. We can't simply remove `pointer-events-none` if the element is a child of a Tooltip component, because a disabled button natively "swallows" pointer events anyway, meaning the Tooltip's wrapper `span` never receives the hover event!
**Action:** Keep `pointer-events-none` on the disabled button itself (so it is transparent to pointer events), and instead apply `cursor-not-allowed` to the wrapper `span` generated by the Tooltip component so the wrapper can show the cursor and trigger the tooltip.

## 2024-06-20 - Use dynamic focus-visible rings for modal consistency

**Learning:** When adding focus rings (`focus-visible:ring-2`) to shared components like modals, hardcoding a color like `toxic-green` breaks the thematic consistency of sections that use dynamic accents (e.g., Bandhaus, Merch Workshop).
**Action:** Use Tailwind's arbitrary values with CSS variables to ensure the focus ring always matches the current section's dynamic accent color, providing a fallback: `focus-visible:ring-[var(--section-accent,var(--color-toxic-green))]`.

## 2026-06-21 - Focus Rings on Nested Data View Buttons

**Learning:** Interactive elements nested deep within data views (like "Craft", "Make Amends", or "Use" buttons inside `DetailedStats` panels) are often overlooked for keyboard navigation styling, breaking accessibility for users trying to take action on specific rows of data.
**Action:** Always verify that interactive buttons within lists, tables, or detailed views have explicit `focus-visible` utility classes applied (e.g., `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-2 focus-visible:ring-offset-abyss-black` if nested inside Panel components with `bg-abyss-black` backgrounds) to ensure they are visually apparent when navigating by keyboard without creating visual seams.

## 2026-06-22 - Focus Rings on Member Traits

**Learning:** Interactive trait buttons within detailed member views lacked explicit focus rings, making them unreachable via keyboard navigation for users who rely on tab navigation to interact with tooltip information or trait statuses.
**Action:** Always add explicit focus-visible rings (e.g. `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-2 focus-visible:ring-offset-void-black`) to inner buttons of nested interactive components like Member Traits to ensure complete accessibility without degrading visual style.

## 2024-06-24 - Form Input Accessibility

**Learning:** Native `<label>` elements wrapping inputs without `htmlFor` and `id` bindings may fail certain strict screen-reader tests or contexts, especially for inputs like `<input type="range">`. Additionally, `type="range"` inputs often lack context when their values are read as plain numbers.
**Action:** Always bind labels and inputs explicitly using `htmlFor` and `id`. Provide `aria-valuetext` for range sliders to give screen readers meaningful context for numeric values (e.g., `aria-valuetext="50 Fame"` instead of just "50").

## 2026-07-01 - ARIA toggle groups using ActionButton

**Learning:** Custom toggle groups in settings (like the Language selector) use standard `<button>` elements (via `ActionButton`) instead of semantic radio inputs. Without explicit state attributes, screen reader users cannot identify which language is currently active when navigating the settings.
**Action:** When using multiple `ActionButton` components to act as a mutually exclusive toggle group, always supply `aria-pressed={isActiveCondition}` to explicitly convey the selected state to assistive technologies.

## 2026-07-02 - ARIA Expanded on Accordion Buttons

**Learning:** Buttons that act as accordions or expandable menus (like the main OverworldMenu toggle) often visually indicate their state using text changes (e.g. "[OPEN MENU]" vs "[CLOSE MENU]"), but screen readers lack the semantic linkage connecting the button's toggle state to the visibility of the controlled content panel.
**Action:** When a button toggles the visibility of a container, always use `aria-expanded={isOpen}` to announce its current state and `aria-controls={containerId}` to programmatically link the button to the expanded content. Pass `undefined` to `aria-controls` if the target element is conditionally unmounted from the DOM when closed.

## 2024-07-11 - Add ARIA label to Warning Icon in BandMemberRow

**Learning:** Icon-only warning states in HUD components (`AlertCircle` in `BandMemberRow`) lacked implicit accessibility context. Relying solely on `Tooltip` wrappers fails for screen readers since `lucide-react` icons aren`t inherently accessible.
**Action:** Always add `role="img"`and a localized`aria-label`directly to`lucide-react` SVG components when used as status indicators, even if wrapped in a Tooltip.

## 2024-05-24 - Deadman Button ARIA Label

**Learning:** Found that an accessible button missing an aria-label can make screen reader navigation confusing, especially if it relies on visually hidden or styled text like Deadman buttons.
**Action:** Always verify that interactive components with complex state texts have an explicit `aria-label` conveying instructions (e.g. `HOLD TO OVERRIDE`).
