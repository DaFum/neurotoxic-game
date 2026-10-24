import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import { EffectManager } from './EffectManager'

/**
 * Represents an item carried by the roadie player.
 */
type RoadieCarriedItem = {
  type: string
}

/**
 * Defines the state required to render the roadie player.
 */
export type RoadieRenderState = {
  playerPos: { x: number; y: number }
  carrying: RoadieCarriedItem | null
  equipmentDamage: number
}

/**
 * Manages rendering resources and state for the roadie player.
 *
 * @remarks
 * Encapsulates the PixiJS containers, sprites, and visual effects associated
 * with the roadie character during a minigame sequence. It handles positioning,
 * carrying state visuals, and damage feedback.
 */
export class RoadiePlayerManager {
  playerContainer: Container | null
  playerSprite: Sprite | Graphics | null
  itemSprite: Sprite | null
  effectManager: EffectManager | null
  _flashTimeout: ReturnType<typeof setTimeout> | null
  lastDamage: number
  textures: {
    roadie: import('pixi.js').Texture | null
    items: Record<string, import('pixi.js').Texture | undefined>
  }
  colors: {
    bloodRed: number
    starWhite: number
    toxicGreen: number
  }
  lastCarryingType: string | null | undefined = undefined
  lastCellW = -1
  lastCellH = -1
  lastWasFlashing = false

  /**
   * Initializes a new instance of the RoadiePlayerManager.
   *
   * @param textures - The textures for the roadie and carried items.
   * @param colors - The color palette for visual effects and tinting.
   */
  constructor(
    textures: {
      roadie: import('pixi.js').Texture | null
      items: Record<string, import('pixi.js').Texture | undefined>
    },
    colors: {
      bloodRed: number
      starWhite: number
      toxicGreen: number
    }
  ) {
    this.playerContainer = null
    this.playerSprite = null
    this.itemSprite = null
    this.effectManager = null
    this._flashTimeout = null
    this.lastDamage = 0
    this.textures = textures
    this.colors = colors
  }

  /**
   * Initializes the player container and sprites, attaching them to the parent container.
   *
   * @param container - The parent container to which the player elements are added.
   * @param cellW - The width of a single grid cell.
   * @param cellH - The height of a single grid cell.
   */
  setup(container: Container, cellW: number, cellH: number) {
    this.lastCarryingType = undefined
    this.lastCellW = -1
    this.lastCellH = -1
    this.lastWasFlashing = false

    // Player Container (Groups body + item)
    this.playerContainer = new Container()
    container.addChild(this.playerContainer)

    // Player Sprite
    if (this.textures.roadie) {
      this.playerSprite = new Sprite(this.textures.roadie)
      this.playerSprite.anchor.set(0.5)
      // Scale to fit ~1 cell
      const playerScale =
        Math.min(
          cellW / this.textures.roadie.width,
          cellH / this.textures.roadie.height
        ) * 0.8
      this.playerSprite.scale.set(playerScale)
    } else {
      this.playerSprite = new Graphics()
      ;(this.playerSprite as Graphics).circle(0, 0, 20)
      ;(this.playerSprite as Graphics).fill(this.colors.toxicGreen)
    }
    this.playerContainer.addChild(this.playerSprite)

    // Item sprite: textured and shown only while the roadie is carrying an item.
    this.itemSprite = new Sprite()
    this.itemSprite.anchor.set(0.5)
    this.itemSprite.y = -(cellH * 0.3) // Above head
    this.itemSprite.visible = false
    this.playerContainer.addChild(this.itemSprite)
  }

  /**
   * Assigns an effect manager for spawning visual feedback, such as hit particles.
   *
   * @param effectManager - The effect manager instance to use.
   */
  setEffectManager(effectManager: EffectManager) {
    this.effectManager = effectManager
  }

  /**
   * Updates the spatial coordinates of the player container based on the grid state.
   *
   * @param state - The current render state containing the player's logical position.
   * @param cellW - The width of a single grid cell.
   * @param cellH - The height of a single grid cell.
   */
  updatePlayerPosition(state: RoadieRenderState, cellW: number, cellH: number) {
    if (this.playerContainer) {
      this.playerContainer.x = (state.playerPos.x + 0.5) * cellW
      this.playerContainer.y = (state.playerPos.y + 0.5) * cellH
    }
  }

  /**
   * Synchronizes the visibility, texture, and tinting of the carried item sprite based on state.
   *
   * @param state - The current render state detailing what item is being carried.
   * @param cellW - The width of a single grid cell.
   * @param cellH - The height of a single grid cell.
   */
  updateCarryingVisuals(
    state: RoadieRenderState,
    cellW: number,
    cellH: number
  ) {
    if (!this.itemSprite || !this.textures.items) return

    const currentType = state.carrying ? state.carrying.type : null
    const isFlashing = this._flashTimeout !== null

    // ⚡ BOLT OPTIMIZATION: Short-circuit when carrying item type, grid dimensions, and flash status are unchanged
    // What: Added state tracking (`lastCarryingType`, `lastCellW`, `lastCellH`, `lastWasFlashing`) to bypass sprite property mutations during tick loops.
    // Why: updateCarryingVisuals runs on every frame tick (~60 FPS) in the Roadie minigame update loop. Setting texture, scale, and tint every frame triggers unnecessary PixiJS matrix/transform dirty recalculations.
    // Impact: Avoids ~3,600 redundant PixiJS texture/scale/tint property mutations per minute during stable Roadie gameplay while respecting flash transitions.
    if (
      currentType === this.lastCarryingType &&
      cellW === this.lastCellW &&
      cellH === this.lastCellH &&
      isFlashing === this.lastWasFlashing
    ) {
      return
    }

    this.lastCarryingType = currentType
    this.lastCellW = cellW
    this.lastCellH = cellH
    this.lastWasFlashing = isFlashing

    if (state.carrying) {
      this.itemSprite.visible = true
      // Set texture based on type
      const tex = this.textures.items[state.carrying.type]
      if (tex && tex.width > 0 && tex.height > 0) {
        this.itemSprite.texture = tex
        // Scale item to fit ~0.6 of a cell
        const itemScale = Math.min(cellW / tex.width, cellH / tex.height) * 0.6
        this.itemSprite.scale.set(itemScale)
      } else {
        this.itemSprite.texture = Texture.WHITE
        this.itemSprite.scale.set(0.3)
      }

      // Apply toxic green tint to player sprite when carrying CONTRABAND
      if (
        state.carrying.type === 'CONTRABAND' &&
        this.playerSprite &&
        !this._flashTimeout
      ) {
        this.playerSprite.tint = this.colors.toxicGreen
      } else if (this.playerSprite && !this._flashTimeout) {
        this.playerSprite.tint = this.colors.starWhite
      }
    } else {
      this.itemSprite.visible = false
      if (this.playerSprite && !this._flashTimeout) {
        this.playerSprite.tint = this.colors.starWhite
      }
    }
  }

  /**
   * Detects increases in equipment damage to trigger visual hit effects and sprite flashing.
   *
   * @param state - The current render state containing the accumulated damage value.
   */
  checkDamageTriggers(state: RoadieRenderState) {
    if (state.equipmentDamage > this.lastDamage) {
      // Trigger Hit Effect
      const redColor = this.colors.bloodRed
      if (this.effectManager && this.playerContainer) {
        this.effectManager.spawnHitEffect(
          this.playerContainer.x,
          this.playerContainer.y,
          redColor
        )
      }
      this.lastDamage = state.equipmentDamage

      // Flash player
      if (this.playerSprite) {
        this.playerSprite.tint = redColor
        if (this._flashTimeout) clearTimeout(this._flashTimeout)
        this._flashTimeout = setTimeout(() => {
          if (this.playerSprite) {
            this.playerSprite.tint =
              state.carrying && state.carrying.type === 'CONTRABAND'
                ? this.colors.toxicGreen
                : this.colors.starWhite
          }
          this._flashTimeout = null
        }, 200)
      }
    }
  }

  /**
   * Cleans up all managed PixiJS display objects and clears active timeouts.
   */
  dispose() {
    this.lastCarryingType = undefined
    this.lastCellW = -1
    this.lastCellH = -1
    this.lastWasFlashing = false

    if (this._flashTimeout) {
      clearTimeout(this._flashTimeout)
      this._flashTimeout = null
    }
    if (this.playerSprite) {
      this.playerSprite.destroy()
    }
    if (this.itemSprite) {
      this.itemSprite.destroy()
    }
    if (this.playerContainer) {
      this.playerContainer.destroy({ children: true })
    }
    this.playerContainer = null
    this.playerSprite = null
    this.itemSprite = null
    this.effectManager = null
  }
}
