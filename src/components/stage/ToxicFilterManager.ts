import { ColorMatrixFilter, Container } from 'pixi.js'
import * as PIXI from 'pixi.js'
import type { RhythmGameRefState } from '../../types/rhythmGame'
// Brutalist CRT / Aberration / Glitch Shader
const crtFrag = `in vec2 vTextureCoord;
uniform sampler2D uTexture; // PIXI v8 uses uTexture
uniform float uTime;
uniform float uIntensity;
out vec4 finalColor;

void main(void) {
  vec2 uv = vTextureCoord;

  // Glitch
  float glitchOffset = sin(uTime * 10.0 + uv.y * 20.0) * 0.005 * uIntensity;
  if(sin(uTime * 5.0) > 0.95) {
     uv.x += glitchOffset;
  }

  // Chromatic Aberration
  float r = texture(uTexture, uv + vec2(0.003 * uIntensity, 0.0)).r;
  float g = texture(uTexture, uv).g;
  float b = texture(uTexture, uv - vec2(0.003 * uIntensity, 0.0)).b;

  // Scanline Effect
  float scanline = sin(uv.y * 800.0) * 0.04 * uIntensity;

  vec4 color = vec4(r, g, b, 1.0);
  color.rgb -= scanline;

  finalColor = color;
}
`

const defaultVert = `in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition( void )
{
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;

    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord( void )
{
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main() {
  vTextureCoord = filterTextureCoord();
  gl_Position = filterVertexPosition();
}
`

const BaseFilter = PIXI.Filter || class {}

/**
 * Applies a brutalist CRT, chromatic aberration, and glitch effect shader.
 * @remarks Extends PIXI.Filter and sets up the custom GLProgram with predefined vertex and fragment shaders.
 */
export class BrutalistFilter extends BaseFilter {
  /**
   * Initializes the BrutalistFilter with its GLProgram and uniforms.
   */
  constructor() {
    if (!PIXI.Filter || !PIXI.GlProgram) {
      super({})
      return
    }
    const glProgram = PIXI.GlProgram.from({
      vertex: defaultVert,
      fragment: crtFrag,
      name: 'brutalist-filter'
    })

    super({
      glProgram,
      resources: {
        filterUniforms: {
          uTime: { type: 'f32', value: 0 },
          uIntensity: { type: 'f32', value: 1.0 }
        }
      }
    })
  }

  /**
   * Updates the shader uniforms for the current frame.
   * @param time - The current elapsed time used for animation.
   * @param intensity - The intensity multiplier for the effect.
   */
  update(time: number, intensity: number) {
    if (this.resources?.filterUniforms) {
      this.resources.filterUniforms.uniforms.uTime = time * 0.001
      this.resources.filterUniforms.uniforms.uIntensity = intensity
    }
  }

  /**
   * Destroys the filter and cleans up its resources.
   */
  destroy() {
    if (typeof super.destroy === 'function') {
      super.destroy()
    }
  }
}

/**
 * Manages toxic mode filter effects for the stage.
 */
export class ToxicFilterManager {
  colorMatrix: ColorMatrixFilter | null
  brutalistFilter: BrutalistFilter | null
  toxicFilters: PIXI.Filter[] | null
  isToxicActive: boolean

  /**
   * Initializes the ToxicFilterManager with its required filters.
   */
  constructor() {
    this.isToxicActive = false
    this.colorMatrix = new ColorMatrixFilter()
    this.brutalistFilter = new BrutalistFilter()
    this.toxicFilters = [this.colorMatrix, this.brutalistFilter]
  }

  /**
   * Updates toxic mode filter effects based on game state.
   * @param state - The current rhythm game reference state.
   * @param elapsed - The elapsed gig time in milliseconds.
   * @param stageContainer - The PixiJS container to apply the filters to.
   */
  update(
    state: Pick<RhythmGameRefState, 'isToxicMode' | 'combo'>,
    elapsed: number,
    stageContainer: Container
  ): void {
    if (state.isToxicMode) {
      if (this.colorMatrix) {
        // Apply Hue change based on time
        this.colorMatrix.hue(Math.sin(elapsed / 100) * 180, false)
        this.colorMatrix.contrast(1.5, true)
        this.colorMatrix.brightness(1.2, true)
      }
      if (!this.isToxicActive && stageContainer) {
        stageContainer.filters = this.toxicFilters
        this.isToxicActive = true
      }
    } else {
      if (this.isToxicActive && stageContainer) {
        stageContainer.filters = null
        this.isToxicActive = false
      }
    }
  }

  /**
   * Checks if the manager is ready for updates.
   * @returns A boolean indicating whether the toxic filters are available.
   */
  isReady(): boolean {
    return !!this.toxicFilters
  }

  /**
   * Disposes PixiJS resources related to toxic filters.
   */
  dispose(): void {
    if (this.colorMatrix) {
      this.colorMatrix.destroy()
      this.colorMatrix = null
    }
    if (this.brutalistFilter) {
      this.brutalistFilter.destroy()
      this.brutalistFilter = null
    }

    this.toxicFilters = null
  }
}
