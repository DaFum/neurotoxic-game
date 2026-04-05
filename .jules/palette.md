## 2025-02-18 - Tooltip Container Layout

**Learning:** When conditionally wrapping full-width components (like buttons) in a `Tooltip` component (which defaults to an `inline-block` layout), the wrapper can cause the inner button to shrink unexpectedly. Passing class names from the parent can lead to class conflicts (e.g. `block` vs `inline-block` in Tailwind).
**Action:** Instead of hardcoding layout classes from the parent, the `Tooltip` component should dynamically read the child element`s `className`(using`React.cloneElement`or direct reading) and apply necessary layout properties (like`w-full block`) to both its outer `div`and inner disabled`span` wrappers automatically. This preserves the layout of full-width children safely without duplicate prop passing.

## 2025-02-28 - Tooltip for Locked Songs in Pre-Gig Setlist

**Learning:** Locked items (like songs) in list selections often lack context as to _why_ they are locked, especially when the locking condition is tied to a specific game mode (e.g., 'Prove Yourself' mode). While adding a tooltip directly to a disabled `<button>` is tempting, it often fails accessibility and interaction tests because disabled elements do not trigger mouse or keyboard events reliably across browsers.
**Action:** Always wrap disabled interactive elements in a focusable container (like a `<span tabIndex={0}>`) if they need to trigger a tooltip, ensuring the reason for the disabled state is accessible to both mouse and keyboard users.
