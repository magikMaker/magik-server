/**
 * Format date for display
 *
 * @module magik-server/utils/format-date
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  return date.toISOString().replace('T', ' ').slice(0, 19);
}
