import { logger } from './logger.js'

export const validateCrisisEvent = (event) => {
  if (!event || typeof event !== 'object') {
    logger.error('EventValidation', 'Event is null or not an object');
    return false;
  }

  let isValid = true;

  if (typeof event.id !== 'string') { logger.error('EventValidation', 'Missing or invalid id'); isValid = false; }
  if (typeof event.category !== 'string') { logger.error('EventValidation', 'Missing or invalid category'); isValid = false; }
  if (!Array.isArray(event.tags)) { logger.error('EventValidation', 'Missing or invalid tags'); isValid = false; }
  else {
    for (const tag of event.tags) {
      if (typeof tag !== 'string') { logger.error('EventValidation', 'Tag must be a string'); isValid = false; break; }
    }
  }
  if (typeof event.title !== 'string') { logger.error('EventValidation', 'Missing or invalid title'); isValid = false; }
  if (typeof event.description !== 'string') { logger.error('EventValidation', 'Missing or invalid description'); isValid = false; }
  if (typeof event.trigger !== 'string') { logger.error('EventValidation', 'Missing or invalid trigger'); isValid = false; }
  if (typeof event.chance !== 'number') { logger.error('EventValidation', 'Missing or invalid chance'); isValid = false; }
  if (event.condition !== undefined && typeof event.condition !== 'function') { logger.error('EventValidation', 'Condition must be a function'); isValid = false; }

  if (!Array.isArray(event.options) || event.options.length === 0) {
    logger.error('EventValidation', 'Missing or empty options');
    isValid = false;
  } else {
    for (const opt of event.options) {
      if (!opt || typeof opt !== 'object') { logger.error('EventValidation', 'Option must be an object'); isValid = false; continue; }
      if (typeof opt.label !== 'string') { logger.error('EventValidation', 'Option missing label'); isValid = false; }
      if (typeof opt.outcomeText !== 'string') { logger.error('EventValidation', 'Option missing outcomeText'); isValid = false; }
      if (opt.effect !== undefined && typeof opt.effect !== 'object') { logger.error('EventValidation', 'Option effect must be an object'); isValid = false; }
      if (opt.skillCheck !== undefined && typeof opt.skillCheck !== 'object') { logger.error('EventValidation', 'Option skillCheck must be an object'); isValid = false; }
    }
  }

  return isValid;
};
