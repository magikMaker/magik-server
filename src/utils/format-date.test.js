/**
 * Tests for format-date functionality
 * @jest-environment node
 */

import { formatDate } from './format-date';

describe('formatDate', () => {
  it('should format a date correctly', () => {
    // Create a fixed date for consistent testing
    const testDate = new Date('2023-05-15T14:30:45.123Z');

    // Expected format: YYYY-MM-DD HH:MM:SS
    const expected = '2023-05-15 14:30:45';

    expect(formatDate(testDate)).toBe(expected);
  });

  it('should handle different time zones consistently', () => {
    // Create the same moment in time but with a specific timezone offset
    const testDate = new Date('2023-05-15T10:30:45.123-04:00'); // Eastern Time

    // The result should be in UTC/ISO format, regardless of the input timezone
    const expected = '2023-05-15 14:30:45';

    expect(formatDate(testDate)).toBe(expected);
  });

  it('should truncate milliseconds', () => {
    const testDate = new Date('2023-05-15T14:30:45.999Z');
    const formatted = formatDate(testDate);

    // Should not contain milliseconds
    expect(formatted).not.toContain('.');
    expect(formatted.length).toBe(19); // YYYY-MM-DD HH:MM:SS = 19 chars
  });

  it('should replace T with a space', () => {
    const testDate = new Date('2023-05-15T14:30:45Z');
    const formatted = formatDate(testDate);

    // Should not contain 'T'
    expect(formatted).not.toContain('T');
    // Should contain a space between date and time
    expect(formatted).toContain(' ');
  });
});
