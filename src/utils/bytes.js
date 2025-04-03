/**
 * Represents the different orders of magnitude of bytes.
 *
 * @constant
 * @type {Readonly<{B: bigint, KB: bigint, MB: bigint, GB: bigint, TB: bigint, PB: bigint}>}
 * @property {bigint} B  - 1 byte
 * @property {bigint} KB - 1 kilobyte (1024 bytes)
 * @property {bigint} MB - 1 megabyte (1024^2 bytes)
 * @property {bigint} GB - 1 gigabyte (1024^3 bytes)
 * @property {bigint} TB - 1 terabyte (1024^4 bytes)
 * @property {bigint} PB - 1 petabyte (1024^5 bytes)
 */
const MAP = Object.freeze({
  B: 1n,
  KB: 1n << 10n,  // 2^10 = 1024
  MB: 1n << 20n,  // 2^20 = 1,048,576
  GB: 1n << 30n,  // 2^30 = 1,073,741,824
  TB: 1n << 40n,  // 2^40 = 1,099,511,627,776
  PB: 1n << 50n   // 2^50 = 1,125,899,906,842,624
});

/**
 * Formats a given number of bytes into a human-readable string with the appropriate unit.
 * Uses the system's locale for formatting.
 *
 * @param {number} value - The number of bytes, max value 2^53 or 9PB
 * @param {string} [locale] - Optional locale override (e.g., "en-US", "de-DE").
 * @returns {string} Formatted byte size string (e.g., "9.71 MB").
 */
export function bytes(value, locale = Intl.NumberFormat().resolvedOptions().locale) {
  if (!Number.isFinite(value) || value < 0) {
    // console.warn(`bytes function received invalid input: ${value}`);
    return '';
  }

  let unit = 'B';

  if (value >= MAP.PB) {
    unit = 'PB';
  } else if (value >= MAP.TB) {
    unit = 'TB';
  } else if (value >= MAP.GB) {
    unit = 'GB';
  } else if (value >= MAP.MB) {
    unit = 'MB';
  } else if (value >= MAP.KB) {
    unit = 'KB';
  }

  // const calculated = Number(BigInt(value) / MAP[unit]);
  const calculated = value / Number(MAP[unit]);
  const truncated = Math.floor(calculated * 100) / 100;

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    //minimumFractionDigits: 2,
    // minimumSignificantDigi ts: 2,
    style: 'decimal'
  }).format(truncated) + ' ' + unit;
}
