import * as PIXI from 'pixi.js';
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen';
import { calculateCrowdY, calculateLaneStartX, calculateNoteY } from '../utils/pixiStageUtils';

/**
 * Manages Pixi.js stage lifecycle and rendering updates.
 */
export class PixiStageController {
    /**
     * @param {object} params - Controller dependencies.
     * @param {React.MutableRefObject<HTMLElement|null>} params.containerRef - DOM container ref.
     * @param {React.MutableRefObject<object>} params.gameStateRef - Mutable game state ref.
     * @param {React.MutableRefObject<Function|null>} params.updateRef - Update callback ref.
     * @param {React.MutableRefObject<object>} params.statsRef - Stats ref for UI-driven effects.
     */
    constructor({ containerRef, gameStateRef, updateRef, statsRef }) {
        this.containerRef = containerRef;
        this.gameStateRef = gameStateRef;
        this.updateRef = updateRef;
        this.statsRef = statsRef;
        this.app = null;
        this.colorMatrix = null;
        this.stageContainer = null;
        this.rhythmContainer = null;
        this.crowdMembers = [];
        this.laneGraphics = [];
        this.noteContainer = null;
        this.noteTexture = null;
        this.handleTicker = this.handleTicker.bind(this);
    }

    /**
     * Initializes the Pixi application and stage objects.
     * @returns {Promise<void>} Resolves when initialization completes.
     */
    async init() {
        try {
            this.app = new PIXI.Application();
            await this.app.init({
                backgroundAlpha: 0,
                resizeTo: this.containerRef.current,
                antialias: true
            });

            if (!this.containerRef.current || !this.app) {
                this.dispose();
                return;
            }

            this.containerRef.current.appendChild(this.app.canvas);
            this.colorMatrix = new PIXI.ColorMatrixFilter();
            this.stageContainer = new PIXI.Container();
            this.app.stage.addChild(this.stageContainer);

            await this.loadAssets();
            this.createCrowd();
            this.createLanes();
            this.createNoteContainer();
            this.app.ticker.add(this.handleTicker);
        } catch (error) {
            console.error('[PixiStageController] Failed to initialize stage.', error);
            this.dispose();
        }
    }

    /**
     * Loads textures used by the renderer.
     * @returns {Promise<void>} Resolves when assets are loaded.
     */
    async loadAssets() {
        try {
            const noteTextureUrl = getGenImageUrl(IMG_PROMPTS.NOTE_SKULL);
            this.noteTexture = await PIXI.Assets.load(noteTextureUrl);
        } catch (error) {
            this.noteTexture = null;
            console.warn('[PixiStageController] Note texture unavailable, using fallback.', error);
        }
    }

    /**
     * Builds the crowd sprites and adds them to the stage.
     * @returns {void}
     */
    createCrowd() {
        const crowdContainer = new PIXI.Container();
        crowdContainer.y = this.app.screen.height * 0.5;
        this.stageContainer.addChild(crowdContainer);

        for (let i = 0; i < 50; i += 1) {
            const crowd = new PIXI.Graphics();
            crowd.circle(0, 0, 3 + Math.random() * 2);
            crowd.fill(0x333333);
            crowd.x = Math.random() * this.app.screen.width;
            crowd.y = Math.random() * (this.app.screen.height * 0.1);
            crowd.baseY = crowd.y;
            crowdContainer.addChild(crowd);
            this.crowdMembers.push(crowd);
        }
    }

    /**
     * Creates lane graphics and caches their positions.
     * @returns {void}
     */
    createLanes() {
        this.rhythmContainer = new PIXI.Container();
        this.rhythmContainer.y = this.app.screen.height * 0.6;
        this.stageContainer.addChild(this.rhythmContainer);

        const laneTotalWidth = 360;
        const startX = calculateLaneStartX({
            screenWidth: this.app.screen.width,
            laneTotalWidth
        });

        this.gameStateRef.current.lanes.forEach((lane, index) => {
            const laneX = startX + lane.x;
            const graphics = new PIXI.Graphics();
            graphics.rect(laneX, 0, 100, this.app.screen.height * 0.4);
            graphics.fill({ color: 0x000000, alpha: 0.8 });
            graphics.stroke({ width: 2, color: 0x333333 });

            this.rhythmContainer.addChild(graphics);
            lane.renderX = laneX;
            this.laneGraphics[index] = graphics;
        });
    }

    /**
     * Creates a container for note sprites.
     * @returns {void}
     */
    createNoteContainer() {
        this.noteContainer = new PIXI.Container();
        if (this.rhythmContainer) {
            this.rhythmContainer.addChild(this.noteContainer);
        } else {
            this.stageContainer.addChild(this.noteContainer);
        }
    }

    /**
     * Updates lane visuals based on input state.
     * @param {object} state - Current game state ref.
     * @returns {void}
     */
    updateLaneGraphics(state) {
        state.lanes.forEach((lane, index) => {
            const graphics = this.laneGraphics[index];
            graphics.clear();
            graphics.rect(lane.renderX, 0, 100, this.app.screen.height * 0.4);
            graphics.fill({ color: 0x000000, alpha: 0.8 });
            graphics.stroke({ width: 2, color: 0x333333 });

            const hitY = this.app.screen.height * 0.4 - 60;
            graphics.rect(lane.renderX, hitY, 100, 20);
            if (lane.active) {
                graphics.fill({ color: lane.color, alpha: 0.8 });
                graphics.stroke({ width: 4, color: 0xFFFFFF });
            } else {
                graphics.stroke({ width: 4, color: lane.color });
            }
        });
    }

    /**
     * Updates crowd visuals based on combo and mode.
     * @param {number} combo - Current combo count.
     * @param {boolean} isToxicMode - Toxic mode state.
     * @param {number} timeMs - Current time in ms.
     * @returns {void}
     */
    updateCrowd(combo, isToxicMode, timeMs) {
        this.crowdMembers.forEach(member => {
            member.y = calculateCrowdY({ baseY: member.baseY, combo, timeMs });
            member.fill(isToxicMode ? 0x00FF41 : (combo > 20 ? 0xFFFFFF : 0x555555));
        });
    }

    /**
     * Creates or updates note sprites.
     * @param {object} state - Current game state ref.
     * @param {number} elapsed - Elapsed time since start in ms.
     * @returns {void}
     */
    updateNotes(state, elapsed) {
        const targetY = (this.app.screen.height * 0.4) - 60;

        state.notes.forEach(note => {
            if (note.visible && !note.hit && !note.sprite && elapsed >= note.time - 2000) {
                const lane = state.lanes[note.laneIndex];
                note.sprite = this.createNoteSprite(lane);
                this.noteContainer.addChild(note.sprite);
            }

            if (!note.sprite) {
                return;
            }

            if (!note.visible || note.hit) {
                note.sprite.visible = false;
                return;
            }

            note.sprite.visible = true;
            const jitterOffset = state.modifiers.noteJitter ? (Math.random() - 0.5) * 10 : 0;
            note.sprite.y = calculateNoteY({
                elapsed,
                noteTime: note.time,
                targetY,
                speed: state.speed
            });
            note.sprite.x = state.lanes[note.laneIndex].renderX + 50 + jitterOffset;
        });
    }

    /**
     * Creates a note sprite with a texture fallback.
     * @param {object} lane - Lane configuration.
     * @returns {PIXI.DisplayObject} Note sprite instance.
     */
    createNoteSprite(lane) {
        if (this.noteTexture) {
            const sprite = new PIXI.Sprite(this.noteTexture);
            sprite.width = 80;
            sprite.height = 80;
            sprite.anchor.set(0.5);
            sprite.x = lane.renderX + 50;
            sprite.y = -50;
            sprite.tint = lane.color;
            return sprite;
        }

        const rect = new PIXI.Graphics();
        rect.rect(0, 0, 90, 20);
        rect.fill(lane.color);
        rect.x = lane.renderX + 5;
        rect.y = -50;
        return rect;
    }

    /**
     * Handles ticker updates from Pixi.js.
     * @param {PIXI.Ticker} ticker - Pixi ticker instance.
     * @returns {void}
     */
    handleTicker(ticker) {
        if (this.updateRef.current) {
            this.updateRef.current(ticker.deltaMS);
        }

        const state = this.gameStateRef.current;
        const stats = this.statsRef.current;

        if (!state.running && !state.pauseTime) {
            return;
        }

        const now = Date.now();
        const elapsed = now - state.startTime;

        if (stats?.isToxicMode) {
            this.colorMatrix.hue(Math.sin(now / 100) * 180, false);
            this.stageContainer.filters = [this.colorMatrix];
        } else {
            this.stageContainer.filters = [];
        }

        this.updateLaneGraphics(state);
        this.updateCrowd(stats?.combo ?? 0, stats?.isToxicMode, now);
        this.updateNotes(state, elapsed);
    }

    /**
     * Disposes Pixi resources and removes the canvas.
     * @returns {void}
     */
    dispose() {
        if (this.app && this.app.ticker) {
            this.app.ticker.remove(this.handleTicker);
        }

        if (this.gameStateRef?.current?.notes) {
            this.gameStateRef.current.notes.forEach(note => {
                if (note.sprite?.destroy) {
                    note.sprite.destroy();
                    note.sprite = null;
                }
            });
        }

        if (this.app) {
            this.app.destroy(true, { children: true, texture: true, baseTexture: true });
            this.app = null;
        }

        if (this.containerRef?.current) {
            this.containerRef.current.innerHTML = '';
        }
    }
}

/**
 * Factory for PixiStageController instances.
 * @param {object} params - Controller dependencies.
 * @returns {PixiStageController} Controller instance.
 */
export const createPixiStageController = (params) => new PixiStageController(params);
