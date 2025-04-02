/**
 * Tests for magik-server
 * @jest-environment node
 */

import http from 'http';
import { createServer } from '../src/server/server.js';

// Mock config for testing
const mockConfig = {
  address: 'localhost',
  port: 8081,
  pkg: { name: 'magik-server', version: '1.0.0' },
  versionInfo: '(v1.0.0)',
  protocol: 'http',
  root: './',
  cors: false,
  dirs: true,
  extensions: ['html', 'htm', 'js'],
  index: ['index', 'default', 'main', 'app'],
  hidden: false,
  'not-found': '404',
  statusCodeParam: 'magik-status',
  timeParam: 'magik-time',
  time: 0
};

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    access: jest.fn().mockResolvedValue(true),
    stat: jest.fn().mockResolvedValue({ isDirectory: () => false, isFile: () => true })
  },
  readFile: jest.fn((path, callback) => callback(null, Buffer.from('<html>Test</html>'))),
  existsSync: jest.fn(() => true),
  statSync: jest.fn(() => ({ isDirectory: () => false, isFile: () => true })),
  readdir: jest.fn((path, callback) => callback(null, ['test.html', 'test.js']))
}));

describe('magik-server', () => {
  let server;
  let httpServer;

  beforeEach(() => {
    server = createServer(mockConfig);
    httpServer = server.server;
    
    // Mock server listen method
    httpServer.listen = jest.fn((port, address, callback) => {
      if (callback) callback();
      return httpServer;
    });
    
    // Mock server close method
    httpServer.close = jest.fn(callback => {
      if (callback) callback();
      return httpServer;
    });
  });

  test('should create a server instance', () => {
    expect(server).toBeDefined();
    expect(httpServer).toBeDefined();
  });

  test('should listen on specified port and address', () => {
    server.listen(8081, 'localhost', () => {});
    expect(httpServer.listen).toHaveBeenCalledWith(8081, 'localhost', expect.any(Function));
  });

  test('should close the server', () => {
    const callback = jest.fn();
    server.close(callback);
    expect(httpServer.close).toHaveBeenCalledWith(callback);
  });

  test('should throw error when no config is provided', () => {
    expect(() => createServer()).toThrow();
  });
});
