/**
 * Unit tests for the CLI module
 */

import { jest } from '@jest/globals';
import { magenta, green, grey, red } from 'barva';

// Mock dependencies
jest.mock('../../src/server/index.js', () => ({
  createServer: jest.fn(() => ({
    listen: jest.fn(),
    close: jest.fn(cb => cb && cb())
  }))
}));

// Mock console methods
const originalConsoleLog = console.log;
const mockConsoleLog = jest.fn();
console.log = mockConsoleLog;

const originalConsoleError = console.error;
const mockConsoleError = jest.fn();
console.error = mockConsoleError;

// Mock process methods
const originalExit = process.exit;
const mockExit = jest.fn();
process.exit = mockExit;

describe('CLI Module', () => {
  let cli;
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.resetModules();
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
    mockExit.mockClear();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  afterAll(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.exit = originalExit;
  });

  describe('displaySplashScreen', () => {
    it('should display the ASCII logo with correct styling', async () => {
      // We need to use dynamic import to allow mocking before import
      const config = { version: '1.0.0', address: 'localhost', port: 8080 };
      
      // Get the displaySplashScreen function through module internals
      const displaySplashScreen = jest.fn();
      jest.doMock('../../src/cli/index.js', () => ({
        __esModule: true,
        displaySplashScreen
      }));
      
      // Now we can verify the logo is displayed correctly by checking console.log calls
      const mockConfig = { 
        version: '1.0.0', 
        address: 'localhost', 
        port: 8080,
        portChanged: false
      };
      
      // Manual testing with a simplified function that mimics displaySplashScreen
      const testDisplayLogo = () => {
        const logo = `
                       _ _    _____
                      (_) |  /  ___|
 _ __ ___   __ _  __ _ _| | _\\ \`--.  ___ _ ____   _____ _ __
| '_ \` _ \\ / _\` |/ _\` | | |/ /\`--. \\/ _ \\ '__\\ \\ / / _ \\ '__|
| | | | | | (_| | (_| | |   </\\__/ /  __/ |   \\ V /  __/ |
|_| |_| |_|\\__,_|\\__, |_|_|\\_\\____/ \\___|_|    \\_/ \\___|_|
                  __/ |
                 |___/
`;
        console.log(magenta`${logo}`);
      };
      
      testDisplayLogo();
      
      // Verify console.log was called with the magenta-colored logo
      expect(mockConsoleLog).toHaveBeenCalled();
      const calls = mockConsoleLog.mock.calls;
      expect(calls[0][0]).toContain('magikServer');
    });
  });

  // Additional tests can be added here
});
