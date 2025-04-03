/**
 * Tests for directory listing functionality
 */

import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { createDirectoryListing } from './directory-listing.js';
import { bytes, formatDate } from '../utils/index.js';
import { red } from 'barva';

// Manual mocks for ES modules
const mockFs = {
  readdir: jest.fn(),
  stat: jest.fn()
};

const mockPath = {
  join: jest.fn(),
  posix: {
    join: jest.fn()
  }
};

const mockUtils = {
  bytes: jest.fn(size => `${size} B`),
  formatDate: jest.fn(date => '2023-01-01 12:00:00')
};

const mockBarva = {
  red: jest.fn((...args) => args.join(' '))
};

// Replace actual modules with mocks
fs.readdir = mockFs.readdir;
fs.stat = mockFs.stat;
path.join = mockPath.join;
path.posix.join = mockPath.posix.join;

// Mock console.log for tests
let originalConsoleLog;

describe('createDirectoryListing', () => {
  beforeEach(() => {
    // Save original console.log
    originalConsoleLog = console.log;
    console.log = jest.fn();

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original console.log
    console.log = originalConsoleLog;
  });

  it('should handle errors when reading directory', () => {
    // Setup
    const responseObj = {
      filePath: '/test/path',
      pathName: '/test'
    };
    const callback = jest.fn();

    // Mock fs.readdir to simulate an error
    mockFs.readdir.mockImplementation((path, cb) => {
      cb(new Error('Test error'), null);
    });

    // Execute
    createDirectoryListing(responseObj, callback);

    // Verify
    expect(mockFs.readdir).toHaveBeenCalledWith('/test/path', expect.any(Function));
    expect(console.log).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith('<p class="error">Error reading directory</p>');
  });

  it('should generate correct HTML for root directory', async () => {
    // Setup
    const responseObj = {
      filePath: '/',
      pathName: '/',
      config: { hidden: false }
    };
    const callback = jest.fn();

    // Mock file list
    const mockFiles = ['file1.txt', 'folder1'];

    // Mock fs functions
    mockFs.readdir.mockImplementation((path, cb) => {
      cb(null, mockFiles);
    });

    mockFs.stat.mockImplementation((filePath, cb) => {
      const isDir = filePath.includes('folder1');
      cb(null, {
        isDirectory: () => isDir,
        size: isDir ? 0 : 1024,
        mtime: new Date()
      });
    });

    // Mock path.join to return predictable paths
    mockPath.join.mockImplementation((dir, file) => `${dir}/${file}`);
    mockPath.posix.join.mockImplementation((dir, file) => `${dir}${file}`);

    // Execute
    createDirectoryListing(responseObj, callback);

    // We need to wait for the promise resolution
    await new Promise(process.nextTick);

    // Verify callback was called with correct HTML
    expect(callback).toHaveBeenCalled();
    const htmlResult = callback.mock.calls[0][0];

    // Verify HTML structure
    expect(htmlResult).toContain('<table class="listing">');
    expect(htmlResult).toContain('<tr><th>Name</th><th>Type</th><th>Size</th><th>Modified</th></tr>');

    // Should not have parent directory link (we're at root)
    expect(htmlResult).not.toContain('<a href="..">..</a>');

    // Should have our files and folders in correct order (folders first)
    expect(htmlResult).toContain('<a href="/folder1/">folder1/</a>');
    expect(htmlResult).toContain('<a href="/file1.txt">file1.txt</a>');

    // Verify directories come before files in the output
    const folderIndex = htmlResult.indexOf('folder1/');
    const fileIndex = htmlResult.indexOf('file1.txt');
    expect(folderIndex).toBeLessThan(fileIndex);
  });

  it('should include parent directory link when not at root', async () => {
    // Setup
    const responseObj = {
      filePath: '/test/path/',
      pathName: '/test/path/',
      config: { hidden: false }
    };
    const callback = jest.fn();

    // Mock fs functions
    mockFs.readdir.mockImplementation((path, cb) => {
      cb(null, []);
    });

    // Execute
    createDirectoryListing(responseObj, callback);

    // We need to wait for the promise resolution
    await new Promise(process.nextTick);

    // Verify parent directory link
    expect(callback).toHaveBeenCalled();
    const htmlResult = callback.mock.calls[0][0];
    expect(htmlResult).toContain('<a href="/test/">..</a>');
  });

  it('should filter hidden files when config.hidden is false', async () => {
    // Setup
    const responseObj = {
      filePath: '/test/path',
      pathName: '/test/path/',
      config: { hidden: false }
    };
    const callback = jest.fn();

    // Mock files including hidden ones
    const mockFiles = ['normal.txt', '.hidden'];

    // Mock fs functions
    mockFs.readdir.mockImplementation((path, cb) => {
      cb(null, mockFiles);
    });

    mockFs.stat.mockImplementation((filePath, cb) => {
      cb(null, {
        isDirectory: () => false,
        size: 1024,
        mtime: new Date()
      });
    });

    // Mock path functions
    mockPath.join.mockImplementation((dir, file) => `${dir}/${file}`);
    mockPath.posix.join.mockImplementation((dir, file) => `${dir}${file}`);

    // Execute
    createDirectoryListing(responseObj, callback);

    // We need to wait for the promise resolution
    await new Promise(process.nextTick);

    // Verify only non-hidden files are included
    expect(callback).toHaveBeenCalled();
    const htmlResult = callback.mock.calls[0][0];
    expect(htmlResult).toContain('normal.txt');
    expect(htmlResult).not.toContain('.hidden');
  });

  it('should show hidden files when config.hidden is true', async () => {
    // Setup
    const responseObj = {
      filePath: '/test/path',
      pathName: '/test/path/',
      config: { hidden: true }
    };
    const callback = jest.fn();

    // Mock files including hidden ones
    const mockFiles = ['normal.txt', '.hidden'];

    // Mock fs functions
    mockFs.readdir.mockImplementation((path, cb) => {
      cb(null, mockFiles);
    });

    mockFs.stat.mockImplementation((filePath, cb) => {
      cb(null, {
        isDirectory: () => false,
        size: 1024,
        mtime: new Date()
      });
    });

    // Mock path functions
    mockPath.join.mockImplementation((dir, file) => `${dir}/${file}`);
    mockPath.posix.join.mockImplementation((dir, file) => `${dir}${file}`);

    // Execute
    createDirectoryListing(responseObj, callback);

    // We need to wait for the promise resolution
    await new Promise(process.nextTick);

    // Verify both files are included
    expect(callback).toHaveBeenCalled();
    const htmlResult = callback.mock.calls[0][0];
    expect(htmlResult).toContain('normal.txt');
    expect(htmlResult).toContain('.hidden');
  });

  it('should handle errors when getting file stats', async () => {
    // Setup
    const responseObj = {
      filePath: '/test/path',
      pathName: '/test/path/',
      config: { hidden: false }
    };
    const callback = jest.fn();

    // Mock files
    const mockFiles = ['good.txt', 'bad.txt'];

    // Mock fs functions
    mockFs.readdir.mockImplementation((path, cb) => {
      cb(null, mockFiles);
    });

    mockFs.stat.mockImplementation((filePath, cb) => {
      if (filePath.includes('bad.txt')) {
        cb(new Error('Stat error'), null);
      } else {
        cb(null, {
          isDirectory: () => false,
          size: 1024,
          mtime: new Date()
        });
      }
    });

    // Mock path functions
    mockPath.join.mockImplementation((dir, file) => `${dir}/${file}`);
    mockPath.posix.join.mockImplementation((dir, file) => `${dir}${file}`);

    // Execute
    createDirectoryListing(responseObj, callback);

    // We need to wait for the promise resolution
    await new Promise(process.nextTick);

    // Verify only the good file is included
    expect(callback).toHaveBeenCalled();
    const htmlResult = callback.mock.calls[0][0];
    expect(htmlResult).toContain('good.txt');
    expect(htmlResult).not.toContain('bad.txt');
  });

  it('should handle Promise.all error during file processing', async () => {
    // Setup
    const responseObj = {
      filePath: '/test/path',
      pathName: '/test/path/',
      config: { hidden: false }
    };
    const callback = jest.fn();

    // Mock fs.readdir
    mockFs.readdir.mockImplementation((path, cb) => {
      cb(null, ['file.txt']);
    });

    // Mock Promise.all to fail
    const originalPromiseAll = Promise.all;
    Promise.all = jest.fn().mockImplementation(() => Promise.reject('Test error'));

    // Execute
    createDirectoryListing(responseObj, callback);

    // We need to wait for the promise rejection
    await new Promise(resolve => setTimeout(resolve, 0));

    // Verify error handling
    expect(console.log).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith('<p class="error">Error processing directory contents</p>');

    // Restore Promise.all
    Promise.all = originalPromiseAll;
  });
});
