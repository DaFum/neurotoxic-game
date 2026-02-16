import * as PIXI from 'pixi.js'
import { calculateCrowdY, CROWD_LAYOUT } from '../../utils/pixiStageUtils.js'

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
  }

  init() {
    this.container = new PIXI.Container()
    this.container.y = this.app.screen.height * CROWD_LAYOUT.containerYRatio
    this.stageContainer.addChild(this.container)

    for (let i = 0; i < CROWD_LAYOUT.memberCount; i += 1) {
      const crowd = new PIXI.Graphics()
      const radius =
        CROWD_LAYOUT.minRadius + Math.random() * CROWD_LAYOUT.radiusVariance
      crowd.circle(0, 0, radius)
      crowd.fill(0xffffff)
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
