/**
 * Clears the flat background around a generated sprite.
 *
 * @remarks
 * Generated minigame sprites arrive as opaque JPEGs painted on a solid white or
 * black field, which shows as a square around the sprite. The fill starts at the
 * image border and only spreads through pixels close to the border colour, so a
 * same-coloured area inside the sprite (a black van body, a dark outline) stays
 * opaque as long as the sprite's edge encloses it.
 *
 * @param data - RGBA pixels, row-major; alpha is cleared in place.
 * @param width - Image width in pixels.
 * @param height - Image height in pixels.
 * @param tolerance - Largest per-channel distance from the background colour
 * that still counts as background.
 */
export const clearEdgeBackground = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  tolerance = 40
): void => {
  if (width <= 0 || height <= 0 || data.length < width * height * 4) return

  // The corners decide the background colour; a sprite rarely touches them.
  const corners = [0, width - 1, (height - 1) * width, height * width - 1]
  let red = 0
  let green = 0
  let blue = 0
  for (const pixel of corners) {
    red += data[pixel * 4] ?? 0
    green += data[pixel * 4 + 1] ?? 0
    blue += data[pixel * 4 + 2] ?? 0
  }
  red /= corners.length
  green /= corners.length
  blue /= corners.length

  const isBackground = (pixel: number): boolean => {
    const offset = pixel * 4
    return (
      Math.abs((data[offset] ?? 0) - red) <= tolerance &&
      Math.abs((data[offset + 1] ?? 0) - green) <= tolerance &&
      Math.abs((data[offset + 2] ?? 0) - blue) <= tolerance
    )
  }

  const visited = new Uint8Array(width * height)
  const queue = new Int32Array(width * height)
  let head = 0
  let tail = 0
  const seed = (pixel: number): void => {
    if (visited[pixel] || !isBackground(pixel)) return
    visited[pixel] = 1
    queue[tail++] = pixel
  }

  for (let x = 0; x < width; x++) {
    seed(x)
    seed((height - 1) * width + x)
  }
  for (let y = 0; y < height; y++) {
    seed(y * width)
    seed(y * width + width - 1)
  }

  while (head < tail) {
    const pixel = queue[head++] as number
    data[pixel * 4 + 3] = 0
    const x = pixel % width
    if (x > 0) seed(pixel - 1)
    if (x < width - 1) seed(pixel + 1)
    if (pixel >= width) seed(pixel - width)
    if (pixel < (height - 1) * width) seed(pixel + width)
  }
}
