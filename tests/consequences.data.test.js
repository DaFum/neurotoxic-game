import { describe, it, expect } from 'vitest';
import { CONSEQUENCE_EVENTS } from '../src/data/events/consequences.js';

describe('Consequences Event Pool', () => {
  it('should export an array of consequence events', () => {
    expect(Array.isArray(CONSEQUENCE_EVENTS)).toBe(true);
    expect(CONSEQUENCE_EVENTS.length).toBeGreaterThan(0);
  });

  it('each event should have the correct shape', () => {
    CONSEQUENCE_EVENTS.forEach((event) => {
      expect(event).toHaveProperty('id');
      expect(typeof event.id).toBe('string');
      expect(event).toHaveProperty('category');
      expect(typeof event.category).toBe('string');
      expect(event).toHaveProperty('title');
      expect(event.title.startsWith('events:')).toBe(true);
      expect(event).toHaveProperty('options');
      expect(Array.isArray(event.options)).toBe(true);
    });
  });

  it('evaluates conditions properly', () => {
    const venueComplaint = CONSEQUENCE_EVENTS.find((e) => e.id === 'consequences_venue_complaint');
    expect(venueComplaint).toBeDefined();

    // Condition: score < 30 and no cooldown
    expect(venueComplaint.condition({ lastGigStats: { score: 20 }, eventCooldowns: [] })).toBe(true);
    expect(venueComplaint.condition({ lastGigStats: { score: 40 }, eventCooldowns: [] })).toBe(false);
    expect(
      venueComplaint.condition({
        lastGigStats: { score: 20 },
        eventCooldowns: ['consequences_venue_complaint'],
      })
    ).toBe(false);
  });
});
