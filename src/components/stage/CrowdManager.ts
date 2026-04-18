// TODO: Review this file
import { Application, Container, Graphics, Sprite, Texture } from 'pixi.js'
import {
  calculateCrowdOffset,
  CROWD_LAYOUT,
  getPixiColorFromToken,
  loadTextures
} from './utils'
import { getGenImageUrl, IMG_PROMPTS } from '../../utils/imageGen'
import { handleError } from '../../utils/errorHandler'
import { getSafeRandom } from '../../utils/crypto'

type CrowdTextures = {
  idle: Texture | null
  mosh: Texture | null
}

type CrowdColors = {
  toxicGreen: number
  starWhite: number
  ashGray: number
}

type CrowdMemberBase = {
  baseY: number
  radius: number
  currentFillColor: number
  tint: number
}
type CrowdSpriteMember = Sprite & CrowdMemberBase & { isSprite: true }
type CrowdGraphicsMember = Graphics & CrowdMemberBase & { isSprite: false }
type CrowdMember = CrowdSpriteMember | CrowdGraphicsMember

export class CrowdManager {
  app: Application
  stageContainer: Container
  crowdMembers: CrowdMember[]
  container: Container | null
  textures: CrowdTextures
  colors: CrowdColors
  /**
   * @param {Application} app
   * @param {Container} stageContainer
   */
  constructor(app: Application, stageContainer: Container) {
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

  async loadAssets(): Promise<void> {
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

  init(): void {
    this.container = new Container()
    this.container.y = this.app.screen.height * CROWD_LAYOUT.containerYRatio
    this.stageContainer.addChild(this.container)

    const fallbackColor = this.colors.starWhite
    const mutedColor = this.colors.ashGray

    for (let i = 0; i < CROWD_LAYOUT.memberCount; i += 1) {
      const radius =
        CROWD_LAYOUT.minRadius + getSafeRandom() * CROWD_LAYOUT.radiusVariance

      const crowd = this._createCrowdMember(radius, fallbackColor)

      crowd.tint = mutedColor
      crowd.x = getSafeRandom() * this.app.screen.width
      crowd.y =
        getSafeRandom() * (this.app.screen.height * CROWD_LAYOUT.yRangeRatio)
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
  _createCrowdMember(radius: number, fallbackColor: number): CrowdMember {
    if (this.textures.idle) {
      const crowd = new Sprite(this.textures.idle) as CrowdSpriteMember
      crowd.anchor.set(0.5)
      crowd.width = radius * 2.5 // Adjust scale to match circle size approx
      crowd.height = radius * 2.5
      crowd.isSprite = true
      return crowd
    } else {
      const crowd = new Graphics() as CrowdGraphicsMember
      crowd.circle(0, 0, radius)
      crowd.fill(fallbackColor)
      crowd.isSprite = false
      return crowd
    }
  }

  update(combo: number, isToxicMode: boolean, timeMs: number): void {
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
      const member = this.crowdMembers[i]
      if (!member) continue
      member.y = member.baseY - yOffset

      // Texture swapping logic
      if (member.isSprite) {
        if (targetTexture && member.texture !== targetTexture) {
          member.texture = targetTexture
        }
      }

      if (member.currentFillColor !== nextColor) {
        member.currentFillColor = nextColor
        member.tint = nextColor
      }
    }
  }

  dispose(): void {
    if (this.container) {
      this.container.destroy({ children: true })
      this.container = null
    }
    this.crowdMembers = []
  }
}
