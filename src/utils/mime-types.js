/**
 * MIME type utilities for magik-server
 * @module magik-server/utils/mime-types
 */

/**
 * Determines if a file should be treated as binary based on its MIME type
 * @param {string} mimeType - The MIME type to check
 * @returns {boolean} True if binary, false if text-based
 */
export const isBinaryMimeType = (mimeType) => {
  if (!mimeType) {
    return false;
  }
  
  // Get the main type (e.g., "image" from "image/jpeg")
  const mainType = mimeType.split('/')[0];
  
  // Most common binary file types
  const binaryTypes = [
    'image',
    'audio',
    'video',
    'application/octet-stream',
    'application/pdf',
    'application/zip',
    'application/gzip',
    'application/x-7z-compressed',
    'application/java-archive',
    'application/x-tar',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument',
    'application/msword',
    'application/vnd.ms-powerpoint',
    'font/'
  ];
  
  // Check if this is a common binary type
  if (binaryTypes.includes(mainType)) {
    return true;
  }
  
  // Check for specific application types that are binary
  if (mainType === 'application') {
    // Check if it matches any of the specific binary application types
    return binaryTypes.some(type => 
      type.startsWith('application/') && mimeType.startsWith(type)
    );
  }
  
  return false;
};

/**
 * Determines if a charset should be added to the Content-Type header
 * @param {string} mimeType - The MIME type to check
 * @returns {boolean} True if charset should be added, false otherwise
 */
export const shouldAddCharset = (mimeType) => {
  return !isBinaryMimeType(mimeType);
};
