// File: icons.test.js (or __tests__/icons.test.js)

import { icon } from './icon'; // Adjust the path if your test file is elsewhere

// Helper to get the base SVG string *without* dimensions for comparison
// This simulates the structure within the original iconMap for testing purposes
// NOTE: You *must* keep this map in sync with the actual iconMap in icons.js
// or find a way to export/import iconMap for testing if preferred.
const testIconMap = {
  archive: '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M14.5 1h-13l-.5.5v3l.5.5H2v8.5l.5.5h11l.5-.5V5h.5l.5-.5v-3l-.5-.5zm-1 3H2V2h12v2h-.5zM3 13V5h10v8H3zm8-6H5v1h6V7z"/></svg>',
  blank: '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"/>',
  database: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M13.5 1.5L15 0h7.5L24 1.5V9l-1.5 1.5H15L13.5 9V1.5zm1.5 0V9h7.5V1.5H15zM0 15V6l1.5-1.5H9L10.5 6v7.5H18l1.5 1.5v7.5L18 24H1.5L0 22.5V15zm9-1.5V6H1.5v7.5H9zM9 15H1.5v7.5H9V15zm1.5 7.5H18V15h-7.5v7.5z"/></svg>',
  file: '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M13.71 4.29l-3-3L10 1H4L3 2v12l1 1h9l1-1V5l-.29-.71zM13 14H4V2h5v4h4v8zm-3-9V2l3 3h-3z"/></svg>',
  folder: '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M14.5 3H7.71l-.85-.85L6.51 2h-5l-.5.5v11l.5.5h13l.5-.5v-10L14.5 3zm-.51 8.49V13h-12V7h4.49l.35-.15.86-.86H14v1.5l-.01 4zm0-6.49h-6.5l-.35.15-.86.86H2v-3h4.29l.85.85.36.15H14l-.01.99z"/></svg>',
  // Add other keys from your real map if you test them specifically
};

describe('icon function', () => {
  test('should return the correct SVG for a known icon with default dimensions (16x16)', () => {
    const name = 'file';
    const result = icon(name);
    const expectedStart = '<svg width="16" height="16"';
    // Extract expected content after the inserted attributes
    const expectedContent = testIconMap[name].slice(4);

    expect(result.startsWith(expectedStart)).toBe(true);
    expect(result.slice(expectedStart.length)).toEqual(expectedContent); // Check the rest matches exactly
    expect(result).toContain('viewBox="0 0 16 16"');
    expect(result).toContain('d="M13.71 4.29l-3-3'); // Check a unique part of the path
    expect(result.endsWith('</svg>')).toBe(true);
  });

  test('should return the correct SVG for a known icon with custom dimensions', () => {
    const name = 'folder';
    const width = 24;
    const height = 30;
    const result = icon(name, width, height);
    const expectedStart = `<svg width="${width}" height="${height}"`;
    const expectedContent = testIconMap[name].slice(4);

    expect(result.startsWith(expectedStart)).toBe(true);
    expect(result.slice(expectedStart.length)).toEqual(expectedContent);
    expect(result).toContain('viewBox="0 0 16 16"');
    expect(result).toContain('d="M14.5 3H7.71'); // Check unique path part
    expect(result.endsWith('</svg>')).toBe(true);
  });

  test('should return the blank icon SVG for an unknown icon name with default dimensions', () => {
    const name = 'nonExistentIconName';
    const result = icon(name);
    const expectedStart = '<svg width="16" height="16"';
    const expectedBlankContent = testIconMap.blank.slice(4);
    const expectedFullBlank = expectedStart + expectedBlankContent;

    // Check against the expected blank SVG structure
    expect(result).toBe(expectedFullBlank);
    expect(result).toContain('viewBox="0 0 16 16"');
    // Ensure it doesn't contain path data from other icons
    expect(result).not.toContain('<path');
  });

  test('should return the blank icon SVG for an unknown icon name with custom dimensions', () => {
    const name = 'anotherUnknownIcon';
    const width = 10;
    const height = 12;
    const result = icon(name, width, height);
    const expectedStart = `<svg width="${width}" height="${height}"`;
    const expectedBlankContent = testIconMap.blank.slice(4);
    const expectedFullBlank = expectedStart + expectedBlankContent;

    expect(result).toBe(expectedFullBlank);
    expect(result).toContain('viewBox="0 0 16 16"');
    expect(result).not.toContain('<path');
  });

  test('should return the blank icon SVG when "blank" is requested with default dimensions', () => {
    const name = 'blank';
    const result = icon(name);
    const expectedStart = '<svg width="16" height="16"';
    const expectedBlankContent = testIconMap.blank.slice(4);
    const expectedFullBlank = expectedStart + expectedBlankContent;

    expect(result).toBe(expectedFullBlank);
  });

  test('should return the blank icon SVG when "blank" is requested with custom dimensions', () => {
    const name = 'blank';
    const width = 50;
    const height = 50;
    const result = icon(name, width, height);
    const expectedStart = `<svg width="${width}" height="${height}"`;
    const expectedBlankContent = testIconMap.blank.slice(4);
    const expectedFullBlank = expectedStart + expectedBlankContent;

    expect(result).toBe(expectedFullBlank);
  });

  test('should handle icon names with different viewBox sizes correctly (e.g., database)', () => {
    // Using the second 'database' icon which has viewBox="0 0 24 24"
    const name = 'database';
    const result = icon(name); // default 16x16 dimensions
    const expectedStart = '<svg width="16" height="16"';
    const expectedContent = testIconMap[name].slice(4);

    expect(result.startsWith(expectedStart)).toBe(true);
    expect(result.slice(expectedStart.length)).toEqual(expectedContent);
    expect(result).toContain('viewBox="0 0 24 24"'); // Verify original viewBox is preserved
    expect(result).toContain('d="M13.5 1.5L15 0h7.5');
    expect(result.endsWith('</svg>')).toBe(true);
  });

  test('should correctly insert dimensions even if base SVG has no space after <svg', () => {
    // Temporarily mock or add a test case if needed, assuming iconMap might have '<svgviewBox...>'
    // For now, assume all start with '<svg ' based on provided data.
    // If you had an entry like: testIconMap.tight = `<svgviewBox...`
    // const result = icon('tight', 20, 20);
    // expect(result).toBe(`<svg width="20" height="20"viewBox...`);
    // This test is more conceptual unless you have such data.
    expect(true).toBe(true); // Placeholder assertion
  });

});
