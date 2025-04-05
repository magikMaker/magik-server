/**
 * Tests for MIME type utilities
 */

import { describe, expect, test } from '@jest/globals';
import { isBinaryMimeType, shouldAddCharset } from './mime-types.js';

describe('MIME Type Utilities', () => {
  describe('isBinaryMimeType', () => {
    test('should identify image types as binary', () => {
      expect(isBinaryMimeType('image/jpeg')).toBe(true);
      expect(isBinaryMimeType('image/png')).toBe(true);
      expect(isBinaryMimeType('image/gif')).toBe(true);
      expect(isBinaryMimeType('image/webp')).toBe(true);
    });

    test('should identify video types as binary', () => {
      expect(isBinaryMimeType('video/mp4')).toBe(true);
      expect(isBinaryMimeType('video/webm')).toBe(true);
    });

    test('should identify audio types as binary', () => {
      expect(isBinaryMimeType('audio/mpeg')).toBe(true);
      expect(isBinaryMimeType('audio/wav')).toBe(true);
    });

    test('should identify document types as binary', () => {
      expect(isBinaryMimeType('application/pdf')).toBe(true);
      expect(isBinaryMimeType('application/msword')).toBe(true);
      expect(isBinaryMimeType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true);
    });

    test('should identify text types as non-binary', () => {
      expect(isBinaryMimeType('text/plain')).toBe(false);
      expect(isBinaryMimeType('text/html')).toBe(false);
      expect(isBinaryMimeType('text/css')).toBe(false);
      expect(isBinaryMimeType('text/javascript')).toBe(false);
      expect(isBinaryMimeType('application/json')).toBe(false);
      expect(isBinaryMimeType('application/xml')).toBe(false);
    });

    test('should handle null or undefined values', () => {
      expect(isBinaryMimeType(null)).toBe(false);
      expect(isBinaryMimeType(undefined)).toBe(false);
      expect(isBinaryMimeType('')).toBe(false);
    });
  });

  describe('shouldAddCharset', () => {
    test('should not add charset to binary types', () => {
      expect(shouldAddCharset('image/jpeg')).toBe(false);
      expect(shouldAddCharset('image/png')).toBe(false);
      expect(shouldAddCharset('application/pdf')).toBe(false);
    });

    test('should add charset to text types', () => {
      expect(shouldAddCharset('text/plain')).toBe(true);
      expect(shouldAddCharset('text/html')).toBe(true);
      expect(shouldAddCharset('text/css')).toBe(true);
      expect(shouldAddCharset('text/javascript')).toBe(true);
      expect(shouldAddCharset('application/json')).toBe(true);
      expect(shouldAddCharset('application/xml')).toBe(true);
    });
  });
});
