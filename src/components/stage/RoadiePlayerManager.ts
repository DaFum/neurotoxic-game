import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import { EffectManager } from './EffectManager'

type RoadieCarriedItem = {
  type: string
}

type RoadieRenderState = {
  playerPos: { x: number; y: number }
  carrying: RoadieCarriedItem | null
  equipmentDamage: number
}

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

  setup(container: Container, cellW: number, cellH: number) {
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

    // Item Sprite (Placeholder for now, visible only when carrying)
    this.itemSprite = new Sprite()
    this.itemSprite.anchor.set(0.5)
    this.itemSprite.y = -(cellH * 0.3) // Above head
    this.itemSprite.visible = false
    this.playerContainer.addChild(this.itemSprite)
  }

  setEffectManager(effectManager: EffectManager) {
    this.effectManager = effectManager
  }

  updatePlayerPosition(state: RoadieRenderState, cellW: number, cellH: number) {
    if (this.playerContainer) {
      this.playerContainer.x = (state.playerPos.x + 0.5) * cellW
      this.playerContainer.y = (state.playerPos.y + 0.5) * cellH
    }
  }

  updateCarryingVisuals(
    state: RoadieRenderState,
    cellW: number,
    cellH: number
  ) {
    if (this.itemSprite && this.textures.items) {
      if (state.carrying) {
        this.itemSprite.visible = true
        // Set texture based on type
        const tex = this.textures.items[state.carrying.type]
        if (tex && tex.width > 0 && tex.height > 0) {
          this.itemSprite.texture = tex
          // Scale item to fit ~0.6 of a cell
          const itemScale =
            Math.min(cellW / tex.width, cellH / tex.height) * 0.6
          this.itemSprite.scale.set(itemScale)
        } else {
          this.itemSprite.texture = Texture.WHITE
          this.itemSprite.scale.set(0.3)
        }
      } else {
        this.itemSprite.visible = false
      }
    }
  }

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
          if (this.playerSprite) this.playerSprite.tint = this.colors.starWhite
          this._flashTimeout = null
        }, 200)
      }
    }
  }

  dispose() {
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
