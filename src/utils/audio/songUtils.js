/**
 * Normalizes a song entry to its ID.
 * @param {string|object} item - The song entry (ID string or object with ID).
 * @returns {string} The normalized song ID.
 */
export const getSongId = item => (typeof item === 'string' ? item : item?.id)
