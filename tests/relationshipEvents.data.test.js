import { describe, it } from 'node:test';
import assert from 'node:assert';
import { RELATIONSHIP_EVENTS } from '../src/data/events/relationshipEvents.js';

describe('Relationship Events Data', () => {
  it('should export an array of relationship events', () => {
    assert.strictEqual(Array.isArray(RELATIONSHIP_EVENTS), true);
    assert.ok(RELATIONSHIP_EVENTS.length > 0);
  });

  it('evaluates conditions correctly based on relationships', () => {
    const toxicInfighting = RELATIONSHIP_EVENTS.find((e) => e.id === 'toxic_infighting');
    const synergyMoment = RELATIONSHIP_EVENTS.find((e) => e.id === 'synergy_moment');

    assert.ok(toxicInfighting);
    assert.ok(synergyMoment);

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
    assert.deepStrictEqual(toxicInfighting.condition(lowRelState), { member1: 'Alice', member2: 'Bob' });
    assert.strictEqual(toxicInfighting.condition(highRelState), false);
    assert.strictEqual(toxicInfighting.condition(noMembersState), false);

    // high relationship should trigger synergy moment
    assert.deepStrictEqual(synergyMoment.condition(highRelState), { member1: 'Alice', member2: 'Bob' });
    assert.strictEqual(synergyMoment.condition(lowRelState), false);
    assert.strictEqual(synergyMoment.condition(noMembersState), false);
  });
});
