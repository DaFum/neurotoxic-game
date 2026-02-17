/**
 * Compatibility shim for legacy imports.
 * Canonical import path for the event database is `src/data/events/index.js`.
 * Prefer importing from `./events/index.js` directly in all runtime and test code.
 */

export { EVENTS_DB } from './events/index.js'
