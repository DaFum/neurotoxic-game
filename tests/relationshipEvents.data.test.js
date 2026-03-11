import { describe, it, expect } from 'vitest';
import { RELATIONSHIP_EVENTS } from '../src/data/events/relationshipEvents.js';

describe('Relationship Events Data', () => {
  it('should export an array of relationship events', () => {
    expect(Array.isArray(RELATIONSHIP_EVENTS)).toBe(true);
    expect(RELATIONSHIP_EVENTS.length).toBeGreaterThan(0);
  });

  it('evaluates conditions correctly based on relationships', () => {
    const toxicInfighting = RELATIONSHIP_EVENTS.find((e) => e.id === 'toxic_infighting');
    const synergyMoment = RELATIONSHIP_EVENTS.find((e) => e.id === 'synergy_moment');

    expect(toxicInfighting).toBeDefined();
    expect(synergyMoment).toBeDefined();

    const lowRelState = {
      band: {
        members: [
          { name: 'Alice', relationships: { Bob: 10 } },
          { name: 'Bob', relationships: { Alice: 10 } }
        ]
      }
    };

    const highRelState = {
      band: {
        members: [
          { name: 'Alice', relationships: { Bob: 90 } },
          { name: 'Bob', relationships: { Alice: 90 } }
        ]
      }
    };

    const noMembersState = { band: { members: [] } };

    // low relationship should trigger toxic infighting
    expect(toxicInfighting.condition(lowRelState)).toEqual({ member1: 'Alice', member2: 'Bob' });
    expect(toxicInfighting.condition(highRelState)).toBe(false);
    expect(toxicInfighting.condition(noMembersState)).toBe(false);

    // high relationship should trigger synergy moment
    expect(synergyMoment.condition(highRelState)).toEqual({ member1: 'Alice', member2: 'Bob' });
    expect(synergyMoment.condition(lowRelState)).toBe(false);
    expect(synergyMoment.condition(noMembersState)).toBe(false);
  });
});
