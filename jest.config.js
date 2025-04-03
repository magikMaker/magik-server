export default {
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/__tests__/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  testMatch: ['**/*.test.js'],
  transform: {},
  verbose: true
};


// /*
//   testMatch: ['**/src/__tests__/**/*.test.ts'],
//   collectCoverage: true,



