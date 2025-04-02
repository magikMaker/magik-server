/**
 * Tests for configuration module
 * @jest-environment node
 */

// Mock yargs
jest.mock('yargs', () => {
  const mockYargs = {
    alias: jest.fn().mockReturnThis(),
    describe: jest.fn().mockReturnThis(),
    defaults: jest.fn().mockReturnThis(),
    boolean: jest.fn().mockReturnThis(),
    string: jest.fn().mockReturnThis(),
    config: jest.fn().mockReturnThis(),
    check: jest.fn().mockReturnThis(),
    wrap: jest.fn().mockReturnThis(),
    strict: jest.fn().mockReturnThis(),
    usage: jest.fn().mockReturnThis(),
    version: jest.fn().mockReturnThis(),
    help: jest.fn().mockReturnThis(),
    showHelpOnFail: jest.fn().mockReturnThis(),
    example: jest.fn().mockReturnThis(),
    requiresArg: jest.fn().mockReturnThis(),
    parse: jest.fn().mockReturnValue({
      address: 'localhost',
      port: 8080,
      extensions: 'html, htm, js',
      index: 'index, default, main, app',
      statusCode: null,
      statusCodeParam: 'magik-status',
      time: 0,
      timeParam: 'magik-time',
      dirs: true,
      e: ['html', 'htm', 'js'],
      i: ['index', 'default', 'main', 'app'],
      p: 8080,
      s: null,
      t: 0
    })
  };
  
  return jest.fn(() => mockYargs);
});

describe('Config', () => {
  let config;
  
  beforeEach(() => {
    jest.resetModules();
  });
  
  test('should load default configuration', async () => {
    // Import the module with mocked dependencies
    const { config: configModule } = await import('../src/server/config.js');
    config = configModule;
    
    // Check default values
    expect(config.address).toBe('localhost');
    expect(config.port).toBe(8080);
    expect(config.e).toEqual(['html', 'htm', 'js']);
    expect(config.i).toEqual(['index', 'default', 'main', 'app']);
    expect(config.timeParam).toBe('magik-time');
    expect(config.statusCodeParam).toBe('magik-status');
  });
  
  test('should handle command line options validation', async () => {
    const validateFn = jest.requireMock('yargs')().check.mock.calls[0][0];
    
    // Create a test args object
    const testArgs = {
      D: true,
      extensions: 'css',
      index: 'app',
      p: '9000',
      statusCode: '201',
      time: '500'
    };
    
    // Run validation
    const result = validateFn(testArgs);
    
    // Validate transformation of arguments
    expect(result).toBe(true);
    expect(testArgs.dirs).toBe(false);
    expect(testArgs.extensions).toContain('css');
    expect(testArgs.index).toContain('app');
    expect(testArgs.p).toBe(9000);
    expect(testArgs.statusCodeParam).toBe('magik-status');
    expect(testArgs.timeParam).toBe('magik-time');
  });
});
