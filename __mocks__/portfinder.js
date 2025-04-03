// Create Jest mock functions for the functions exported by the real portfinder
const getPort = jest.fn();

// Simulate the basePort property with a simple variable and getter/setter
let currentBasePort = 8080;

// Default implementation for getPort (can be overridden in tests)
getPort.mockImplementation((options, callback) => {
  // Simulate finding the basePort or the requested port
  callback(null, options?.port || currentBasePort);
});

// Helper function to reset the mock's state between tests
const __resetPortfinderMock = () => {
  getPort.mockClear();
  currentBasePort = 8080;
  // Reset to default implementation
  getPort.mockImplementation((options, callback) => {
    callback(null, options?.port || currentBasePort);
  });
};

// Export the mocked functions and properties matching the real module's structure
// Assuming portfinder primarily uses named exports:
module.exports = {
  getPort,
  get basePort() {
    return currentBasePort;
  },
  set basePort(value) {
    currentBasePort = value;
  },
  __resetPortfinderMock, // Export helper for tests
  __esModule: true, // Important hint for Jest when mocking modules
  // Add a default export if the original module has one
  default: {
    getPort,
    get basePort() { return currentBasePort; },
    set basePort(value) { currentBasePort = value; },
  }
};
