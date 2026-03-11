import { describe, it, expect } from 'vitest';
import { FINANCIAL_EVENTS } from '../src/data/events/financial.js';

describe('Financial Events', () => {
  it('should export an array of financial events', () => {
    expect(Array.isArray(FINANCIAL_EVENTS)).toBe(true);
    expect(FINANCIAL_EVENTS.length).toBeGreaterThan(0);
  });

  it('each event should have the correct properties', () => {
    FINANCIAL_EVENTS.forEach((event) => {
      expect(event).toHaveProperty('id');
      expect(typeof event.id).toBe('string');
      expect(event).toHaveProperty('category', 'financial');
      expect(event).toHaveProperty('title');
      expect(event.title.startsWith('events:')).toBe(true);
      expect(event).toHaveProperty('trigger');
      expect(event).toHaveProperty('chance');
      expect(typeof event.chance).toBe('number');
      expect(event).toHaveProperty('options');
      expect(Array.isArray(event.options)).toBe(true);
      expect(event.options.length).toBeGreaterThan(0);
    });
  });

  it('validates the presence of a specific event', () => {
    const unexpectedBill = FINANCIAL_EVENTS.find((e) => e.id === 'unexpected_bill');
    expect(unexpectedBill).toBeDefined();
    expect(unexpectedBill.options[0].effect.value).toBe(-50);
  });
});
