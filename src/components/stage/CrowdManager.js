// TODO: Review this file
import { Container, Graphics, Sprite } from 'pixi.js'
import {
  calculateCrowdOffset,
  CROWD_LAYOUT,
  getPixiColorFromToken,
  loadTextures
} from './utils.js'
import { getGenImageUrl, IMG_PROMPTS } from '../../utils/imageGen.js'
import { handleError } from '../../utils/errorHandler.js'
import { secureRandom } from '../../utils/crypto.js'

let secureRandomErrorReported = false

const safeRandom = () => {
  try {
    return secureRandom()
  } catch (error) {
    if (!secureRandomErrorReported) {
      secureRandomErrorReported = true
      handleError(error, { silent: true, severity: 'medium' })
    }
    return Math.random()
  }
}

export class CrowdManager {
  /**
   * @param {Application} app
   * @param {Container} stageContainer
   */
  constructor(app, stageContainer) {
    this.app = app
    this.stageContainer = stageContainer
    this.crowdMembers = []
    this.container = null
    this.textures = { idle: null, mosh: null }
    this.colors = {
      toxicGreen: getPixiColorFromToken('--toxic-green'),
      starWhite: getPixiColorFromToken('--star-white'),
      ashGray: getPixiColorFromToken('--ash-gray')
    }
  }

  async loadAssets() {
    try {
      const urls = {
        idle: getGenImageUrl(IMG_PROMPTS.CROWD_IDLE),
        mosh: getGenImageUrl(IMG_PROMPTS.CROWD_MOSH)
      }

      const loadedTextures = await loadTextures(
        urls,
        (error, fallbackMessage) => {
          handleError(error, { fallbackMessage })
        }
      )

      if (loadedTextures.idle) this.textures.idle = loadedTextures.idle
      if (loadedTextures.mosh) this.textures.mosh = loadedTextures.mosh
    } catch (error) {
      handleError(error, {
        fallbackMessage: 'Critical error loading crowd textures.'
      })
    }
  }

  init() {
    this.container = new Container()
    this.container.y = this.app.screen.height * CROWD_LAYOUT.containerYRatio
    this.stageContainer.addChild(this.container)

    const fallbackColor = this.colors.starWhite
    const mutedColor = this.colors.ashGray

    for (let i = 0; i < CROWD_LAYOUT.memberCount; i += 1) {
      const radius =
        CROWD_LAYOUT.minRadius + safeRandom() * CROWD_LAYOUT.radiusVariance

      const crowd = this._createCrowdMember(radius, fallbackColor)

      crowd.tint = mutedColor
      crowd.x = safeRandom() * this.app.screen.width
      crowd.y =
        safeRandom() * (this.app.screen.height * CROWD_LAYOUT.yRangeRatio)
      crowd.baseY = crowd.y
      crowd.radius = radius
      crowd.currentFillColor = mutedColor
      this.container.addChild(crowd)
      this.crowdMembers.push(crowd)
    }
  }

  /**
   * @param {number} radius
   * @param {number} fallbackColor
   * @private
   */
  _createCrowdMember(radius, fallbackColor) {
    let crowd
    if (this.textures.idle) {
      crowd = new Sprite(this.textures.idle)
      crowd.anchor.set(0.5)
      crowd.width = radius * 2.5 // Adjust scale to match circle size approx
      crowd.height = radius * 2.5
    } else {
      crowd = new Graphics()
      crowd.circle(0, 0, radius)
      crowd.fill(fallbackColor)
    }
    return crowd
  }

  update(combo, isToxicMode, timeMs) {
    const yOffset = calculateCrowdOffset({ combo, timeMs })
    const nextColor = isToxicMode
      ? this.colors.toxicGreen
      : combo > 20
        ? this.colors.starWhite
        : this.colors.ashGray

    const shouldMosh = isToxicMode || combo > 20
    const targetTexture =
      shouldMosh && this.textures.mosh ? this.textures.mosh : this.textures.idle

    for (let i = 0; i < this.crowdMembers.length; i++) {
      this._updateMember(
        this.crowdMembers[i],
        yOffset,
        targetTexture,
        nextColor
      )
    }
  }

  /**
   * @param {Sprite|Graphics} member
   * @param {number} yOffset
   * @param {Texture|null} targetTexture
   * @param {number} nextColor
   * @private
   */
  _updateMember(member, yOffset, targetTexture, nextColor) {
    member.y = member.baseY - yOffset

    // Texture swapping logic
    if (member instanceof Sprite) {
      if (targetTexture && member.texture !== targetTexture) {
        member.texture = targetTexture
      }
    }

    if (member.currentFillColor !== nextColor) {
      member.currentFillColor = nextColor
      member.tint = nextColor
    }
  }

  dispose() {
    if (this.container) {
      this.container.destroy({ children: true })
      this.container = null
    }
    this.crowdMembers = []
  }
}
