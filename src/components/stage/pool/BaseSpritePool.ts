import { Container, Sprite } from 'pixi.js'

export abstract class BaseSpritePool<T extends Sprite> {
  container: Container | null
  spritePool: T[]
  protected abstract maxPoolSize: number

  constructor(container: Container | null = null) {
    this.container = container
    this.spritePool = []
  }

  setContainer(container: Container): void {
    this.container = container
  }

  releaseSpriteToPool(sprite: T): void {
    sprite.visible = false
    if (this.spritePool.length < this.maxPoolSize) {
      this.spritePool.push(sprite)
    } else {
      sprite.destroy({ children: true, texture: false, textureSource: false })
    }
  }

  dispose(): void {
    for (let i = 0; i < this.spritePool.length; i++) {
      this.spritePool[i]?.destroy()
    }
    this.spritePool = []
    this.container = null
  }
}
