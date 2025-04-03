/**
 * Unit tests for the CLI module execution
 * @jest-environment node
 */

import { jest } from '@jest/globals';
// Removed unused 'path' and 'childProcess' imports
import { EventEmitter } from 'events';
// Import portfinder normally - Jest will load from __mocks__/portfinder.js
import portfinder from 'portfinder';

// --- Mock External Dependencies ---

// Mock the server module
let mockServerInstance;
const mockCreateServer = jest.fn(/* ... same implementation ... */);
const mockServerConfig = { /* ... same config ... */ };
jest.mock('../server', () => ({
  config: mockServerConfig,
  createServer: mockCreateServer,
}));

// REMOVE the explicit jest.mock('portfinder', ...) block
// jest.mock('portfinder', () => ({ ... })); // DELETE THIS BLOCK

// Mock fs.readFileSync
const mockReadFileSync = jest.fn();
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: mockReadFileSync,
}));

// Mock child_process.exec
const mockExec = jest.fn();
jest.mock('child_process', () => ({
  ...jest.requireActual('child_process'),
  exec: mockExec,
}));

// Mock process.exit
const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleClear = jest.spyOn(console, 'clear').mockImplementation(() => {});


// --- Test Suite ---

describe('CLI Execution', () => {

  const mockPackageJson = { name: 'magik-server', version: '1.2.3' };

  // Get the mock function reference from the manually mocked module
  // Note: Accessing named exports might require drilling into '.default' depending on the mock structure and original module
  const mockGetPort = portfinder.getPort || portfinder.default.getPort;
  const resetPortfinder = portfinder.__resetPortfinderMock || portfinder.default.__resetPortfinderMock;


  const runCliScript = async () => {
    await import('../cli/index.js');
    await new Promise(resolve => setImmediate(resolve));
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset the manual portfinder mock state using the helper
    if (resetPortfinder) {
      resetPortfinder();
    } else {
      // Fallback reset if helper wasn't found (shouldn't happen with above mock)
      mockGetPort.mockClear();
      portfinder.basePort = 8080;
      mockGetPort.mockImplementation((options, callback) => {
        callback(null, options?.port || portfinder.basePort);
      });
    }


    // Default mock implementations (readFileSync, exec)
    mockReadFileSync.mockReturnValue(JSON.stringify(mockPackageJson));
    mockExec.mockImplementation((command, callback) => {
      if (callback) callback(null, '', '');
      const cp = new EventEmitter(); cp.stdout = new EventEmitter(); cp.stderr = new EventEmitter(); return cp;
    });

    // Reset config object state
    mockServerConfig.port = 8080;
    mockServerConfig.address = '127.0.0.1';
    mockServerConfig.open = false;
    delete mockServerConfig.pkg; // etc...
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // --- ALL YOUR 'it(...)' BLOCKS REMAIN LARGELY THE SAME ---
  // Ensure they interact with `portfinder.basePort` and expect `mockGetPort`
  // (the variable holding the reference to the mock function) to be called.

  // Example adjustment in a test:
  it('should find available port and start server', async () => {
    mockServerConfig.port = 9000;
    mockServerConfig.address = '192.168.1.100';
    // Set basePort on the imported (mocked) portfinder object
    portfinder.basePort = mockServerConfig.port;

    // Override the default mock implementation *for this specific test* if needed
    mockGetPort.mockImplementationOnce((options, callback) => {
      expect(options.host).toBe('192.168.1.100');
      // Check the basePort property of the mocked object
      expect(portfinder.basePort).toEqual(9000);
      callback(null, 9000);
    });

    await runCliScript(); // This will now use the manual mock

    expect(mockGetPort).toHaveBeenCalled(); // Check the mock function was called
    // ... rest of assertions remain the same
    expect(mockCreateServer).toHaveBeenCalledWith(mockServerConfig);
    // ...
  });

  // Example error test:
  it('should log error and exit if no suitable port found (EADDRINUSE)', async () => {
    const error = new Error('Address in use');
    error.code = 'EADDRINUSE';
    mockServerConfig.port = 9999;
    portfinder.basePort = mockServerConfig.port; // Set mock's basePort

    // Configure the mock function to return an error for this test
    mockGetPort.mockImplementationOnce((options, callback) => {
      expect(portfinder.basePort).toEqual(9999);
      callback(error); // Simulate EADDRINUSE
    });

    await runCliScript();

    expect(mockGetPort).toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining(`ERROR: no suitable port found (${mockServerConfig.port})`));
    // ... rest of assertions
  });


  // --- PASTE ALL OTHER 'describe' AND 'it' BLOCKS HERE ---
  // (Server Startup Success, openUrl behavior, Server Startup Errors, General Error Handling, Signal Handling)
  // They should generally work without modification, as they already interact
  // with the mocks via variables like `mockGetPort`, `mockExec`, etc.
  // Make sure all references point to the `mockGetPort` variable defined near the top.

  describe('Server Startup Success', () => {
    // ... (it blocks from previous answer, ensuring mockGetPort is used for assertions) ...
    // Paste relevant tests here, check assertions use 'mockGetPort' variable
    it('should find next available port if requested port is in use', async () => {
      mockServerConfig.port = 8080;
      mockServerConfig.address = 'localhost';
      portfinder.basePort = mockServerConfig.port; // Set mock's basePort

      mockGetPort.mockImplementationOnce((options, callback) => { // Use mockImplementationOnce if specific to test
        expect(options.host).toBe('localhost');
        expect(portfinder.basePort).toEqual(8080);
        callback(null, 8081); // Simulate 8080 was busy, return 8081
      });

      await runCliScript();

      expect(mockGetPort).toHaveBeenCalled();
      expect(mockServerConfig.port).toBe(8081);
      expect(mockServerConfig.portChanged).toBe(8080);
      expect(mockCreateServer).toHaveBeenCalledWith(mockServerConfig);
      expect(mockServerInstance.listen).toHaveBeenCalledWith(8081, 'localhost', expect.any(Function));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('WARNING port 8080 in use, changed to 8081'));
    });

    it('should handle port 8080 changing without explicit warning if basePort was 8080', async () => {
      mockServerConfig.port = 8080;
      mockServerConfig.address = 'localhost';
      portfinder.basePort = mockServerConfig.port; // Set mock's basePort

      mockGetPort.mockImplementationOnce((options, callback) => {
        expect(portfinder.basePort).toEqual(8080);
        callback(null, 8081);
      });

      await runCliScript();

      expect(mockGetPort).toHaveBeenCalled(); // Check the correct mock variable
      expect(mockServerConfig.port).toBe(8081);
      expect(mockServerConfig.portChanged).toBe(false); // Because original was 8080
      expect(mockConsoleLog).not.toHaveBeenCalledWith(expect.stringContaining('WARNING port'));
    });

    describe('openUrl behavior', () => {
      // ... (paste openUrl tests here) ...
      const originalPlatform = process.platform;

      afterEach(() => {
        Object.defineProperty(process, 'platform', { value: originalPlatform });
        // Clear exec mock specifically if needed, though jest.clearAllMocks() should handle it
        // mockExec.mockClear();
      });

      it('should call openUrl with correct URL when config.open is true', async () => {
        mockServerConfig.open = true;
        mockServerConfig.port = 8888;
        mockServerConfig.address = 'localhost';
        portfinder.basePort = mockServerConfig.port;

        mockGetPort.mockImplementationOnce((options, callback) => callback(null, 8888));
        Object.defineProperty(process, 'platform', { value: 'darwin' });

        await runCliScript();

        expect(mockServerInstance.listen).toHaveBeenCalled();
        expect(mockExec).toHaveBeenCalledWith('open "http://localhost:8888"', expect.any(Function));
      });

      it('should not call openUrl when config.open is false', async () => {
        mockServerConfig.open = false;
        await runCliScript();
        expect(mockServerInstance.listen).toHaveBeenCalled();
        expect(mockExec).not.toHaveBeenCalled();
      });

      it('should use "start" command on Windows', async () => {
        mockServerConfig.open = true;
        Object.defineProperty(process, 'platform', { value: 'win32' });
        await runCliScript();
        // Get port from config *after* runCliScript as portfinder might change it
        expect(mockExec).toHaveBeenCalledWith(`start "" "http://${mockServerConfig.address}:${mockServerConfig.port}"`, expect.any(Function));
      });

      it('should use "xdg-open" command on Linux', async () => {
        mockServerConfig.open = true;
        Object.defineProperty(process, 'platform', { value: 'linux' });
        await runCliScript();
        expect(mockExec).toHaveBeenCalledWith(`xdg-open "http://${mockServerConfig.address}:${mockServerConfig.port}"`, expect.any(Function));
      });

      it('should log warning if openUrl fails (dynamic import reject)', async () => {
        mockServerConfig.open = true;
        Object.defineProperty(process, 'platform', { value: 'linux' });

        const openError = new Error('Command failed');
        // Simulate the dynamic import('child_process') failing
        const dynamicImportSpy = jest.spyOn(globalThis, 'import');
        dynamicImportSpy.mockImplementation(async (specifier) => {
          if (specifier === 'child_process') {
            throw openError;
          }
          // Allow other dynamic imports if any
          return jest.requireActual(specifier);
        });


        await runCliScript();

        // Check the catch block log in the CLI script's openUrl function
        expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining(`Could not open browser at http://${mockServerConfig.address}:${mockServerConfig.port}`));

        dynamicImportSpy.mockRestore();
      });
    });
  });

  describe('Server Startup Errors (portfinder)', () => {
    // ... (paste portfinder error tests here, ensuring mockGetPort is used) ...
    it('should log error and exit if address is not available (EADDRNOTAVAIL)', async () => {
      const error = new Error('Address not available');
      error.code = 'EADDRNOTAVAIL';
      mockServerConfig.address = 'invalid-address';

      mockGetPort.mockImplementationOnce((options, callback) => { // Use mockImplementationOnce
        expect(options.host).toBe('invalid-address');
        callback(error); // Simulate EADDRNOTAVAIL
      });

      await runCliScript();

      expect(mockGetPort).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining(`ERROR: Server address not available: ${mockServerConfig.address}`));
      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(mockCreateServer).not.toHaveBeenCalled();
    });

    // EADDRINUSE test already shown above as example

    it('should log generic error and exit if portfinder fails unexpectedly', async () => {
      const error = new Error('Some other portfinder error');

      mockGetPort.mockImplementationOnce((options, callback) => { // Use mockImplementationOnce
        callback(error); // Simulate generic error
      });

      await runCliScript();

      expect(mockGetPort).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('ERROR: starting server failed'));
      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(mockCreateServer).not.toHaveBeenCalled();
    });
  });

  describe('General Error Handling', () => {
    // ... (paste general error tests here) ...
    it('should catch and log exceptions during startup sequence', async () => {
      const setupError = new Error('Failed to read config');
      mockReadFileSync.mockImplementation(() => { // Make readFileSync throw
        throw setupError;
      });

      await runCliScript();

      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Error starting server:'), setupError);
      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(mockGetPort).not.toHaveBeenCalled();
      expect(mockCreateServer).not.toHaveBeenCalled();
    });
  });

  describe('Signal Handling', () => {
    // ... (paste signal handling tests here) ...
    const originalPlatform = process.platform;
    let sigintListeners = [];
    let exitListeners = [];
    let processOnSpy;

    beforeAll(() => {
      processOnSpy = jest.spyOn(process, 'on').mockImplementation((event, listener) => {
        if (event === 'SIGINT') sigintListeners.push(listener);
        else if (event === 'exit') exitListeners.push(listener);
        return process;
      });
    });

    beforeEach(() => {
      sigintListeners = [];
      exitListeners = [];
    });

    afterAll(() => {
      processOnSpy.mockRestore();
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    const simulateSignal = async (signal) => {
      const listeners = signal === 'SIGINT' ? sigintListeners : exitListeners;
      for (const listener of listeners) await listener();
      await new Promise(resolve => setImmediate(resolve));
    };

    it('should setup SIGINT and exit handlers on non-Windows platforms', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      await runCliScript();
      expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      expect(processOnSpy).toHaveBeenCalledWith('exit', expect.any(Function));
      expect(sigintListeners.length).toBeGreaterThanOrEqual(1);
      expect(exitListeners.length).toBeGreaterThanOrEqual(1);
    });

    it('should NOT setup SIGINT handler on Windows (but should add exit handler)', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      await runCliScript();
      expect(processOnSpy).not.toHaveBeenCalledWith('SIGINT', expect.any(Function));
      expect(processOnSpy).toHaveBeenCalledWith('exit', expect.any(Function));
      expect(sigintListeners.length).toBe(0);
      expect(exitListeners.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle SIGINT: clear console, log shutdown, close server, exit(0)', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      await runCliScript();
      expect(mockServerInstance).toBeDefined();
      expect(sigintListeners.length).toBeGreaterThan(0);
      await simulateSignal('SIGINT');
      expect(mockConsoleClear).toHaveBeenCalledTimes(2);
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('magik-server shutting down'));
      expect(mockServerInstance.close).toHaveBeenCalledWith(expect.any(Function));
      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });

    it('should handle SIGINT error: log message, exit(1)', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      await runCliScript();
      expect(mockServerInstance).toBeDefined();
      expect(sigintListeners.length).toBeGreaterThan(0);
      const closeError = new Error('Failed to close');
      mockServerInstance.close.mockImplementation(() => { throw closeError; });
      await simulateSignal('SIGINT');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Hold on...'));
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('should handle exit: log server stopped message', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      await runCliScript();
      expect(exitListeners.length).toBeGreaterThan(0);
      await simulateSignal('exit');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('magik-server stopped'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringMatching(/^-+$/));
    });

  });

});
