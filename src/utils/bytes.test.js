/**
 * Tests for bytes functionality
 * @jest-environment node
 */

import { bytes } from './bytes';

// Non-breaking space constant for clarity in tests
const NBSP = '\u00A0';


/**
 * Helper to format numbers using the system's default locale, mimicking
 * Intl.NumberFormat defaults used in the bytes function when no locale is
 * passed. Ensures exactly two decimal places, matching the bytes function's
 * truncation + formatting.
 *
 * @param num
 * @returns {string}
 */
const formatNumberDefaultLocale = (num) => {
  // We know bytes() truncates then formats. Simulate that formatting part.
  // Since Intl.NumberFormat handles the separators, we just need to provide the number.
  // 'undefined' uses the default locale
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
    style: 'decimal'
  }).format(num);
};

describe('bytes() function', () => {

  describe('Basic tests for each unit (using default locale)', () => {
    test('should format small values correctly (B)', () => {
      expect(bytes(0)).toBe(`${formatNumberDefaultLocale(0)} B`);
      expect(bytes(1)).toBe(`${formatNumberDefaultLocale(1)} B`);
      expect(bytes(512)).toBe(`${formatNumberDefaultLocale(512)} B`);
      // Just before KB threshold
      expect(bytes(1023)).toBe(`${formatNumberDefaultLocale(1023)} B`);
    });

    test('should format kilobytes correctly (KB)', () => {
      expect(bytes(1024)).toBe(`${formatNumberDefaultLocale(1.00)} KB`);
      expect(bytes(1536)).toBe(`${formatNumberDefaultLocale(1.50)} KB`);
      expect(bytes(2048)).toBe(`${formatNumberDefaultLocale(2.00)} KB`);
      // Just before MB threshold (1048575 / 1024 = 1023.999...) -> truncated to 1023.99
      expect(bytes(1048575)).toBe(`${formatNumberDefaultLocale(1023.99)} KB`);
    });

    test('should format megabytes correctly (MB)', () => {
      expect(bytes(1048576)).toBe(`${formatNumberDefaultLocale(1.00)} MB`);
      expect(bytes(1572864)).toBe(`${formatNumberDefaultLocale(1.50)} MB`);
      expect(bytes(2097152)).toBe(`${formatNumberDefaultLocale(2.00)} MB`);
      // Just before GB threshold (1073741823 / (1024^2) = 1023.999...) -> truncated to 1023.99
      expect(bytes(1073741823)).toBe(`${formatNumberDefaultLocale(1023.99)} MB`);
    });

    test('should format gigabytes correctly (GB)', () => {
      expect(bytes(1073741824)).toBe(`${formatNumberDefaultLocale(1.00)} GB`);
      expect(bytes(1610612736)).toBe(`${formatNumberDefaultLocale(1.50)} GB`);
      expect(bytes(2147483648)).toBe(`${formatNumberDefaultLocale(2.00)} GB`);
      // Just before TB threshold (1099511627775 / (1024^3) = 1023.999...) -> truncated to 1023.99
      expect(bytes(1099511627775)).toBe(`${formatNumberDefaultLocale(1023.99)} GB`);
    });

    test('should format terabytes correctly (TB)', () => {
      expect(bytes(1099511627776)).toBe(`${formatNumberDefaultLocale(1.00)} TB`);
      expect(bytes(1649267441664)).toBe(`${formatNumberDefaultLocale(1.50)} TB`);
      expect(bytes(2199023255552)).toBe(`${formatNumberDefaultLocale(2.00)} TB`);
      // Just before PB threshold (1125899906842623 / (1024^4) = 1023.999...) -> truncated to 1023.99
      expect(bytes(1125899906842623)).toBe(`${formatNumberDefaultLocale(1023.99)} TB`);
    });

    test('should format petabytes correctly (PB)', () => {
      expect(bytes(1125899906842624)).toBe(`${formatNumberDefaultLocale(1.00)} PB`);
      expect(bytes(1688849860263936)).toBe(`${formatNumberDefaultLocale(1.50)} PB`);
      expect(bytes(2251799813685248)).toBe(`${formatNumberDefaultLocale(2.00)} PB`);
    });
  });

  describe('Locale-based formatting tests', () => {
    test('formats in en-US locale - dot decimal, comma thousands', () => {
      expect(bytes(1048575, 'en-US')).toBe('1,023.99 KB');
      expect(bytes(1234567, 'en-US')).toBe('1.17 MB');
      expect(bytes(1024, 'en-US')).toBe('1 KB');
      expect(bytes(1073741824000, 'en-US')).toBe('1,000 GB');
    });

    test('formats in de-DE locale - comma decimal, dot thousands', () => {
      expect(bytes(1048575, 'de-DE')).toBe('1.023,99 KB');
      expect(bytes(1234567, 'de-DE')).toBe('1,17 MB');
      expect(bytes(1024, 'de-DE')).toBe('1 KB');
      expect(bytes(1073741824000, 'de-DE')).toBe('1.000 GB');
    });

    test('formats in cs-CZ locale - comma decimal, NBSP thousands', () => {
      // Using NBSP constant here
      expect(bytes(1048575, 'cs-CZ')).toBe(`1${NBSP}023,99 KB`);
      expect(bytes(1234567, 'cs-CZ')).toBe('1,17 MB');
      expect(bytes(1024, 'cs-CZ')).toBe('1 KB');
      expect(bytes(1073741824000, 'cs-CZ')).toBe(`1${NBSP}000 GB`);
    });

    // Locales typically without thousands separators for these magnitudes
    test('formats in ja-JP locale - dot decimal, comma thousands (standard)', () => {
      // Intl often uses comma separator for ja-JP despite common perception
      expect(bytes(1048575, 'ja-JP')).toBe('1,023.99 KB');
      expect(bytes(1234567, 'ja-JP')).toBe('1.17 MB');
      expect(bytes(1024, 'ja-JP')).toBe('1 KB');
      expect(bytes(1073741824000, 'ja-JP')).toBe('1,000 GB');
    });

    test('formats using ko-KR locale - dot decimal, comma thousands (standard)', () => {
      // Intl often uses comma separator for ko-KR
      expect(bytes(1048575, 'ko-KR')).toBe('1,023.99 KB');
      expect(bytes(1234567, 'ko-KR')).toBe('1.17 MB');
      expect(bytes(1024, 'ko-KR')).toBe('1 KB');
      expect(bytes(1073741824000, 'ko-KR')).toBe('1,000 GB');
    });

    test('formats using zh-CN locale - dot decimal, comma thousands (standard)', () => {
      // Intl often uses comma separator for zh-CN
      expect(bytes(1048575, 'zh-CN')).toBe('1,023.99 KB');
      expect(bytes(1234567, 'zh-CN')).toBe('1.17 MB');
      expect(bytes(1024, 'zh-CN')).toBe('1 KB');
      expect(bytes(1073741824000, 'zh-CN')).toBe('1,000 GB');
    });
  });

  describe('edge cases', () => {
    // These tests now also rely on the default locale formatting for the number part
    test('handles exactly 1024 boundaries', () => {
      expect(bytes(1024)).toBe(`${formatNumberDefaultLocale(1.00)} KB`);
      expect(bytes(1048576)).toBe(`${formatNumberDefaultLocale(1.00)} MB`);
      expect(bytes(1073741824)).toBe(`${formatNumberDefaultLocale(1.00)} GB`);
      expect(bytes(1099511627776)).toBe(`${formatNumberDefaultLocale(1.00)} TB`);
      expect(bytes(1125899906842624)).toBe(`${formatNumberDefaultLocale(1.00)} PB`);
    });
  });

  describe('input validation', () => {
    test('returns empty string for negative values', () => {
      expect(bytes(-1)).toBe('');
      expect(bytes(-1024)).toBe('');
    });

    test('returns empty string for non-finite numbers', () => {
      expect(bytes(NaN)).toBe('');
      expect(bytes(Infinity)).toBe('');
      expect(bytes(-Infinity)).toBe('');
    });

    test('returns empty string non-numeric input', () => {
      expect(bytes(null)).toBe('');
      expect(bytes(undefined)).toBe('');
      expect(bytes('1000')).toBe('');
      expect(bytes([])).toBe('');
      expect(bytes({})).toBe('');
    });
  });
});
