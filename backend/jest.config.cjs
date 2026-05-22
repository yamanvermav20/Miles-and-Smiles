module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  transform: {},
  setupFiles: ["<rootDir>/test/jest.setup.cjs"],
  
  // Coverage configuration
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/socket/**/*.js", // Exclude socket tests for now
    "!src/config/cloudinary.js", // Exclude cloudinary config
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Test patterns
  testMatch: [
    "**/test/**/*.test.js",
  ],

  // Module paths
  moduleFileExtensions: ["js", "json"],

  // Timeout for async tests
  testTimeout: 30000,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Detect open handles
  detectOpenHandles: true,
  forceExit: true,
};