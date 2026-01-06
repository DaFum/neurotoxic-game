import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen';

export const PixiStage = ({ logic }) => {
    const containerRef = useRef(null);
    const { gameStateRef, update } = logic;
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        let app = null;

        const initPixi = async () => {
            app = new PIXI.Application();
            await app.init({ 
                backgroundAlpha: 0, 
                resizeTo: containerRef.current,
                antialias: true
            });
            
            if (!isMountedRef.current) {
                app.destroy(true, { children: true, texture: true, baseTexture: true });
                return;
            }
            
            if (containerRef.current) {
                containerRef.current.appendChild(app.canvas);
            }

            // Toxic Filter
            const colorMatrix = new PIXI.ColorMatrixFilter();
            
            const stageContainer = new PIXI.Container();
            app.stage.addChild(stageContainer);

            // Load Asset Bundles
            const assets = {
                noteSkull: getGenImageUrl(IMG_PROMPTS.NOTE_SKULL),
                noteBolt: getGenImageUrl(IMG_PROMPTS.NOTE_LIGHTNING),
                hitBlood: getGenImageUrl(IMG_PROMPTS.HIT_BLOOD)
            };

            // Crowd
            const crowdContainer = new PIXI.Container();
            crowdContainer.y = app.screen.height * 0.5;
            stageContainer.addChild(crowdContainer);

            const crowdMembers = [];
            for(let i=0; i<50; i++) {
                const crowd = new PIXI.Graphics();
                crowd.circle(0, 0, 3 + Math.random() * 2);
                crowd.fill(0x333333);
                crowd.x = Math.random() * app.screen.width;
                crowd.y = Math.random() * (app.screen.height * 0.1);
                crowd.baseY = crowd.y;
                crowdContainer.addChild(crowd);
                crowdMembers.push(crowd);
            }

            // Rhythm Container
            const rhythmContainer = new PIXI.Container();
            rhythmContainer.y = app.screen.height * 0.6;
            app.stage.addChild(rhythmContainer);

            const laneTotalWidth = 360; 
            const startX = (app.screen.width - laneTotalWidth) / 2;
            const laneGraphics = [];

            gameStateRef.current.lanes.forEach((lane, i) => {
                const laneX = startX + lane.x;
                const graphics = new PIXI.Graphics();
                
                // Track background
                graphics.rect(laneX, 0, 100, app.screen.height * 0.4);
                graphics.fill({ color: 0x000000, alpha: 0.8 });
                graphics.stroke({ width: 2, color: 0x333333 });
                
                rhythmContainer.addChild(graphics);
                lane.renderX = laneX; 
                laneGraphics[i] = graphics;
            });

            const noteContainer = new PIXI.Container();
            rhythmContainer.addChild(noteContainer);

            app.ticker.add((ticker) => {
                // Call Game Loop Update
                update(ticker.deltaMS);

                const state = gameStateRef.current;
                
                if (!state.running && !state.pauseTime) return;

                const now = Date.now();
                const elapsed = now - state.startTime;

                // TOXIC MODE VISUALS
                if (logic.stats.isToxicMode) {
                     // Update visual effect (pulsating green)
                    colorMatrix.hue(Math.sin(now / 100) * 180, false);
                    stageContainer.filters = [colorMatrix];
                } else {
                    stageContainer.filters = [];
                }

                // Update Lanes Visuals
                state.lanes.forEach((lane, i) => {
                    const graphics = laneGraphics[i];
                    graphics.clear();
                    graphics.rect(lane.renderX, 0, 100, app.screen.height * 0.4);
                    graphics.fill({ color: 0x000000, alpha: 0.8 });
                    graphics.stroke({ width: 2, color: 0x333333 });

                    const hitY = app.screen.height * 0.4 - 60;
                    if (lane.active) {
                        graphics.rect(lane.renderX, hitY, 100, 20);
                        graphics.fill({ color: lane.color, alpha: 0.8 });
                        graphics.stroke({ width: 4, color: 0xFFFFFF });
                    } else {
                        graphics.rect(lane.renderX, hitY, 100, 20);
                        graphics.stroke({ width: 4, color: lane.color });
                    }
                });

                // Animate Crowd
                const combo = logic.stats.combo;
                crowdMembers.forEach(c => {
                    c.y = c.baseY - Math.abs(Math.sin(Date.now() / 100 * (combo > 10 ? 2 : 1)) * 5);
                    c.fill(logic.stats.isToxicMode ? 0x00FF41 : (combo > 20 ? 0xFFFFFF : 0x555555));
                });

                // Spawn/Update Notes Sprites
                state.notes.forEach(note => {
                    // Spawn
                    if (note.visible && !note.sprite && elapsed >= note.time - 2000) {
                        const lane = state.lanes[note.laneIndex];
                        PIXI.Assets.load(assets.noteSkull).then(tex => {
                            if(!note.visible) return;
                            const sprite = new PIXI.Sprite(tex);
                            sprite.width = 80; sprite.height = 80; sprite.anchor.set(0.5);
                            sprite.x = lane.renderX + 50; sprite.y = -50; sprite.tint = lane.color;
                            noteContainer.addChild(sprite);
                            note.sprite = sprite;
                        }).catch(() => {
                            if(!note.visible) return;
                            const rect = new PIXI.Graphics();
                            rect.rect(0, 0, 90, 20); rect.fill(lane.color);
                            rect.x = lane.renderX + 5; rect.y = -50; 
                            noteContainer.addChild(rect);
                            note.sprite = rect;
                        });
                    }

                    // Update Position
                    if (note.sprite) {
                        if (!note.visible || note.hit) {
                             note.sprite.visible = false;
                             // Optionally destroy sprite?
                             // note.sprite.destroy(); 
                             // note.sprite = null;
                        } else {
                            note.sprite.visible = true;
                            const timeUntilHit = note.time - elapsed;
                            const targetY = (app.screen.height * 0.4) - 60;
                            
                            // Note Jitter Modifier
                            let xOffset = 0;
                            if (state.modifiers.noteJitter) {
                                xOffset = (Math.random() - 0.5) * 10;
                            }

                            const y = targetY - (timeUntilHit / 1000) * (state.speed);
                            
                            note.sprite.y = y;
                            note.sprite.x = state.lanes[note.laneIndex].renderX + 50 + xOffset;
                        }
                    }
                });
            });
        };

        initPixi();

        return () => {
            isMountedRef.current = false;
            if (app) app.destroy(true, { children: true, texture: true, baseTexture: true });
        };
    }, [logic]);

    return <div className="absolute inset-0 z-20 pointer-events-none" ref={containerRef}></div>;
};
