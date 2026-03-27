## 2025-02-18 - Tooltip Container Layout

**Learning:** When conditionally wrapping full-width components (like buttons) in a `Tooltip` component (which defaults to an `inline-block` layout), the wrapper can cause the inner button to shrink unexpectedly. Passing class names from the parent can lead to class conflicts (e.g. `block` vs `inline-block` in Tailwind).
**Action:** Instead of hardcoding layout classes from the parent, the `Tooltip` component should dynamically read the child element's `className` (using `React.cloneElement` or direct reading) and apply necessary layout properties (like `w-full block`) to both its outer `div` and inner disabled `span` wrappers automatically. This preserves the layout of full-width children safely without duplicate prop passing.
