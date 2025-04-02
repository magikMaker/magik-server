/**
 * Utility functions for magik-server
 * @module magik-server/utils
 */

/**
 * Format file size with appropriate units
 * @param {number} size - File size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(size) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
}

/**
 * Format date for display
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  return date.toISOString().replace('T', ' ').substr(0, 19);
}
