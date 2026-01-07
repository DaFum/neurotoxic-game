// Aggregate all event categories
import { TRANSPORT_EVENTS } from './transport.js';
import { BAND_EVENTS } from './band.js';
import { GIG_EVENTS } from './gig.js';
import { FINANCIAL_EVENTS } from './financial.js';
import { SPECIAL_EVENTS } from './special.js';

// Validation Helper
const validateEvents = (events) => {
    const ids = new Set();
    events.forEach(e => {
        if (!e.id) console.error("Event missing ID:", e);
        if (ids.has(e.id)) console.error("Duplicate Event ID:", e.id);
        ids.add(e.id);
        if (!['transport', 'band', 'gig', 'financial', 'special'].includes(e.category)) {
            console.warn("Invalid Event Category:", e.category, e.id);
        }
    });
    return events;
};

export const EVENTS_DB = {
    transport: validateEvents(TRANSPORT_EVENTS),
    band: validateEvents(BAND_EVENTS),
    gig: validateEvents(GIG_EVENTS),
    financial: validateEvents(FINANCIAL_EVENTS),
    special: validateEvents(SPECIAL_EVENTS)
};
