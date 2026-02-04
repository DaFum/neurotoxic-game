# Tailwind v4 Integration Patterns

Tailwind CSS v4 treats CSS variables as first-class citizens, enabling powerful integrations with animation and rendering libraries.

## Framer Motion Integration

Since Tailwind v4 defines variables in the CSS layer (e.g., `@theme`), you can animate them directly using Framer Motion.

### 1. Animating Variable Targets

You can use Tailwind variables as target values in `animate` props.

```jsx
import { motion } from "framer-motion";

export const ToxicButton = () => (
  <motion.button
    className="px-4 py-2 bg-(--void-black) text-(--toxic-green) border border-(--toxic-green)"
    whileHover={{
      backgroundColor: "var(--toxic-green)",
      color: "var(--void-black)"
    }}
    transition={{ duration: 0.3 }}
  >
    NEUROTOXIC
  </motion.button>
);
```

### 2. Animating the Variable Itself

For complex effects (e.g., a glow shared by multiple children), animate the variable value itself.

```jsx
<motion.div
  className="p-10 border-(--toxic-green) border"
  initial={{ "--glow-opacity": 0 }}
  animate={{ "--glow-opacity": 1 }}
  style={{
    boxShadow: "0 0 20px rgba(57, 255, 20, var(--glow-opacity))"
  }}
>
  <p className="text-(--toxic-green)">Glow Effect</p>
</motion.div>
```

### 3. Responsive Animations

Use Tailwind variants to set different variable values per breakpoint, which Framer Motion will automatically pick up.

```jsx
<motion.div
  // Tailwind v4 sets different values for --move-x based on screen size
  className="[--move-x:50px] md:[--move-x:200px] w-10 h-10 bg-(--toxic-green)"
  animate={{ x: "var(--move-x)" }}
  transition={{ repeat: Infinity, repeatType: "mirror", duration: 2 }}
/>
```

---

## Pixi.js (v8) Integration

Pixi.js can consume Tailwind v4 variables to synchronize game visuals with the UI theme.

### CSS Variable as Single Source of Truth

Use `getComputedStyle` to read values from the DOM and update Pixi uniforms or properties in the ticker.

```javascript
// Helper to convert Tailwind Hex/OKLCH to RGB for Shaders
const getTailwindColorAsRGB = (varName) => {
  const hex = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  // Conversion logic here...
  return [r, g, b];
};

// ... inside Pixi setup
app.ticker.add(() => {
  const beatScale = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--beat-scale') || "1"
  );

  // Update Pixi Object or Shader Uniform
  circle.scale.set(beatScale);
  shader.resources.uIntensity = (beatScale - 1) * 5;
});
```

### Shader Example (GLSL)

```glsl
precision highp float;
uniform vec3 uToxicColor; // From Tailwind --toxic-green
uniform float uIntensity; // From Audio/Game Logic

void main() {
    vec4 color = texture2D(uSampler, vTextureCoord);
    vec3 highlight = color.rgb + (uToxicColor * uIntensity * 0.5);
    gl_FragColor = vec4(highlight, color.a);
}
```

## Audio Synchronization (Tone.js)

Use Tone.js to drive visual effects by updating CSS variables, which then propagate to both DOM (React) and Canvas (Pixi) elements.

```javascript
Tone.Draw.schedule(() => {
  document.documentElement.style.setProperty('--beat-scale', '1.2');
  setTimeout(() => {
    document.documentElement.style.setProperty('--beat-scale', '1.0');
  }, 100);
}, time);
```
