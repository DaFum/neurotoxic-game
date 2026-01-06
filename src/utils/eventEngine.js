import { EVENTS_DB } from '../data/events.js';

export const eventEngine = {
    // Check if an event triggers
    checkEvent: (category, gameState, triggerPoint = null) => {
        const pool = EVENTS_DB[category];
        if (!pool) return null;

        // 1. Pending Events (Highest Priority)
        // If there are pending events in the queue, trigger them first if context matches
        if (gameState.pendingEvents && gameState.pendingEvents.length > 0) {
            const nextEventId = gameState.pendingEvents[0];
            const pendingEvent = pool.find(e => e.id === nextEventId);
            // Assuming pending events are global, or we need to find which category it belongs to.
            // Simplified: If found in this pool, return it.
            if (pendingEvent) {
                return pendingEvent;
            }
        }

        // 2. Filter by Trigger & Condition
        let eligibleEvents = pool.filter(e => !triggerPoint || e.trigger === triggerPoint);
        eligibleEvents = eligibleEvents.filter(e => {
            if (!e.condition) return true;
            return e.condition(gameState);
        });

        // 3. Filter by Cooldown
        if (gameState.eventCooldowns) {
            eligibleEvents = eligibleEvents.filter(e => !gameState.eventCooldowns.includes(e.id));
        }

        if (eligibleEvents.length === 0) return null;

        // 4. Story Flag Weighting
        // Increase chance if event tags match activeStoryFlags
        // (Assuming events have 'tags' or we check ID substring)
        const storyFlags = gameState.activeStoryFlags || [];
        
        // Shuffle first
        const shuffled = [...eligibleEvents].sort(() => Math.random() - 0.5);

        for (const event of shuffled) {
            let chance = event.chance;
            
            // Boost chance if flag matches
            if (event.requiredFlag && storyFlags.includes(event.requiredFlag)) {
                chance *= 5.0; // Huge boost
            }

            if (Math.random() < chance) {
                return event;
            }
        }
        return null;
    },

    // Resolve a choice
    resolveChoice: (choice, gameState) => {
        let result = null;

        // Skill Check Logic
        if (choice.skillCheck) {
            const { stat, threshold, success, failure } = choice.skillCheck;
            
            // Determine skill value from band members or global stats
            let skillValue = 0;
            const maxMemberSkill = Math.max(...gameState.band.members.map(m => m[stat] || 0));
            
            if (stat === 'luck') skillValue = Math.random() * 10;
            else if (gameState.band[stat] !== undefined) skillValue = gameState.band[stat] / 10;
            else skillValue = maxMemberSkill;

            const roll = Math.random() * 10;
            const total = skillValue + (roll > 8 ? 2 : 0); // Crit chance

            if (total >= threshold) {
                result = { ...success, outcome: 'success' };
            } else {
                result = { ...failure, outcome: 'failure' };
            }
        } else {
            // Direct Effect
            result = { ...choice.effect, outcome: 'direct' };
        }

        // Attach linked event if exists
        if (choice.nextEventId && result.outcome === 'failure') {
             // Usually bad choices lead to chains, or success leads to chains. 
             // We need to support `result.nextEventId` in the data object.
             // Currently `choice.nextEventId` is generic. Let's support `result.nextEventId`.
        }
        
        // If result has specific nextEvent, use it. Else use choice default if any.
        if (!result.nextEventId && choice.nextEventId) {
            result.nextEventId = choice.nextEventId;
        }

        return result;
    },

    // Process event options based on inventory/skills (Dynamic Options)
    processOptions: (event, gameState) => {
        if (!event || !event.options) return event;
        
        // Inventory Auto-Resolution / Override
        // Example: If event has 'van_breakdown' tag and player has 'spare_tire'
        // This logic could be generic or specific.
        // For now, let's implement the specific requested safeguard.
        
        const processedEvent = { ...event, options: [...event.options] };
        
        // Check for specific overrides defined in event data? 
        // Or hardcode logic here? Hardcode is safer for prototype.
        
        if (event.id.includes('van_breakdown') && gameState.band.inventory.spare_tire) {
            // Replace options with "Use Spare Tire"
            processedEvent.options = [
                {
                    label: "Use Spare Tire (Inventory)",
                    effect: { type: 'composite', effects: [
                        { type: 'item', item: 'spare_tire', value: -1 }, // Consume
                        { type: 'stat', stat: 'time', value: -0.5, description: "Quick fix." }
                    ]},
                    outcomeText: "You swapped the tire in record time."
                }
            ];
        }

        // Add more inventory checks here...

        return processedEvent;
    },

    // Apply effects to state (Returns Delta)
    applyResult: (result) => {
        if (!result) return null;
        
        let delta = { player: {}, band: {}, social: {}, flags: {} };

        const processEffect = (eff) => {
            switch(eff.type) {
                case 'resource':
                    if (eff.resource === 'money') delta.player.money = (delta.player.money || 0) + eff.value;
                    if (eff.resource === 'fuel') delta.player.van = { ...(delta.player.van || {}), fuel: eff.value };
                    break;
                case 'stat':
                    if (eff.stat === 'time') delta.player.time = (delta.player.time || 0) + eff.value;
                    if (eff.stat === 'fame') delta.player.fame = (delta.player.fame || 0) + eff.value;
                    if (eff.stat === 'harmony') delta.band.harmony = (delta.band.harmony || 0) + eff.value;
                    if (eff.stat === 'mood') delta.band.members = { moodChange: eff.value };
                    if (eff.stat === 'stamina') delta.band.members = { staminaChange: eff.value };
                    if (eff.stat === 'van_condition') delta.player.van = { ...(delta.player.van || {}), condition: eff.value };
                    if (eff.stat === 'crowd_energy') delta.flags.crowdEnergy = eff.value;
                    if (eff.stat === 'viral') delta.social.viral = (delta.social.viral || 0) + eff.value;
                    if (eff.stat === 'score') delta.flags.score = eff.value;
                    break;
                case 'item':
                    // Add item logic
                    break;
                case 'unlock':
                    delta.flags.unlock = eff.unlock;
                    break;
                case 'game_over':
                    delta.flags.gameOver = true;
                    break;
                case 'flag':
                    delta.flags.addStoryFlag = eff.flag;
                    break;
                case 'chain':
                    delta.flags.queueEvent = eff.eventId;
                    break;
            }
        };

        if (result.type === 'composite') {
            result.effects.forEach(processEffect);
        } else {
            processEffect(result);
        }
        
        // Handle root level properties from resolveChoice injection
        if (result.nextEventId) {
            delta.flags.queueEvent = result.nextEventId;
        }

        return delta;
    }
};
