---
name: pixi-lifecycle-memory-leak-sentinel
description: detect and fix memory leaks in Pixi.js components. Trigger when reviewing Pixi code, scene transitions, or when performance degrades over time.
---

# Pixi Lifecycle Sentinel

Ensure strict lifecycle management for Pixi.js instances to prevent memory leaks.

## Workflow

1.  **Inspect Component Mounting**
    - Find where `new Application()` is called.
    - Ensure it's inside `useEffect`.
    - Check dependency array `[]`.

2.  **Verify Cleanup**
    The `useEffect` return function **MUST**:
    - Call `app.destroy(true, { children: true, texture: true, baseTexture: true })`.
    - Stop the ticker: `app.ticker.stop()`.
    - Remove event listeners: `window.removeEventListener(...)`.

3.  **Check Refs**
    - `useRef` holding the app or textures must be nulled out after destroy.
    - Prevent "zombie" updates by checking `if (!ref.current) return`.

4.  **Audit Textures**
    - Are textures created dynamically?
    - Are they destroyed when the sprite is destroyed?

## Example

**Input**: "Review this Pixi component."

**Code**:

```jsx
useEffect(() => {
  const app = new Application()
  document.body.appendChild(app.view)
}, [])
```

**Issue**: Missing cleanup. App will duplicate on every remount.

**Fix**:

```jsx
useEffect(() => {
  const app = new Application()
  ref.current.appendChild(app.view)

  return () => {
    // Explicitly stop ticker and remove listeners before destroy
    app.ticker.stop()
    // Remove any event listeners attached to window/document here if added
    app.destroy(true, { children: true, texture: true, baseTexture: true })
  }
}, [])
```

**Output**:
"Added cleanup function to destroy the Pixi application on unmount. This prevents canvas duplication and memory leaks."

_Skill sync: compatible with React 19.2.4 / Vite 7.3.1 baseline as of 2026-02-17._
