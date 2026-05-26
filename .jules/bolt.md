## 2024-06-18 - Runtime Validation in Render Loops
**Learning:** Performing deep object shape and property validation (`typeof` checks, casting) within a high-frequency (60fps) render loop hot-path introduces significant CPU overhead and array/object allocation.
**Action:** Trust upstream state logic to enforce strict type shapes, and use TypeScript static typing interfaces. Remove runtime structural checks from renderers.
