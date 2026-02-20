import * as PIXI from 'pixi.js'
import { calculateCrowdY, CROWD_LAYOUT } from './utils.js'
import { getGenImageUrl, IMG_PROMPTS } from '../../utils/imageGen.js'
import { logger } from '../../utils/logger.js'

export class CrowdManager {
  /**
   * @param {PIXI.Application} app
   * @param {PIXI.Container} stageContainer
   */
  constructor(app, stageContainer) {
    this.app = app
    this.stageContainer = stageContainer
    this.crowdMembers = []
    this.container = null
    this.textures = { idle: null, mosh: null }
  }

  async loadAssets() {
    try {
      const results = await Promise.allSettled([
        PIXI.Assets.load(getGenImageUrl(IMG_PROMPTS.CROWD_IDLE)),
        PIXI.Assets.load(getGenImageUrl(IMG_PROMPTS.CROWD_MOSH))
      ])

      if (results[0].status === 'fulfilled')
        this.textures.idle = results[0].value
      if (results[1].status === 'fulfilled')
        this.textures.mosh = results[1].value
    } catch (error) {
      logger.warn('CrowdManager', 'Crowd textures failed to load', error)
    }
  }

  init() {
    this.container = new PIXI.Container()
    this.container.y = this.app.screen.height * CROWD_LAYOUT.containerYRatio
    this.stageContainer.addChild(this.container)

    for (let i = 0; i < CROWD_LAYOUT.memberCount; i += 1) {
      const radius =
        CROWD_LAYOUT.minRadius + Math.random() * CROWD_LAYOUT.radiusVariance

      let crowd
      if (this.textures.idle) {
        crowd = new PIXI.Sprite(this.textures.idle)
        crowd.anchor.set(0.5)
        crowd.width = radius * 2.5 // Adjust scale to match circle size approx
        crowd.height = radius * 2.5
      } else {
        crowd = new PIXI.Graphics()
        crowd.circle(0, 0, radius)
        crowd.fill(0xffffff)
      }

      crowd.tint = 0x333333
      crowd.x = Math.random() * this.app.screen.width
      crowd.y =
        Math.random() * (this.app.screen.height * CROWD_LAYOUT.yRangeRatio)
      crowd.baseY = crowd.y
      crowd.radius = radius
      crowd.currentFillColor = 0x333333
      this.container.addChild(crowd)
      this.crowdMembers.push(crowd)
    }
  }

  update(combo, isToxicMode, timeMs) {
    this.crowdMembers.forEach(member => {
      member.y = calculateCrowdY({ baseY: member.baseY, combo, timeMs })
      const nextColor = isToxicMode
        ? 0x00ff41
        : combo > 20
          ? 0xffffff
          : 0x555555

      // Texture swapping logic
      if (member instanceof PIXI.Sprite) {
        const shouldMosh = isToxicMode || combo > 20
        const targetTexture =
          shouldMosh && this.textures.mosh
            ? this.textures.mosh
            : this.textures.idle

        if (targetTexture && member.texture !== targetTexture) {
          member.texture = targetTexture
        }
      }

      if (member.currentFillColor !== nextColor) {
        member.currentFillColor = nextColor
        member.tint = nextColor
      }
    })
  }

  dispose() {
    if (this.container) {
      this.container.destroy({ children: true })
      this.container = null
    }
    this.crowdMembers = []
  }
}
