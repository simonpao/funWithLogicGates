/**
 * Global test setup for Jest
 * Runs before all test files
 */

// Mock localStorage
global.localStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

// Mock console methods
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: console.log,
  debug: console.debug
};

// Load all classes into global scope
require('./loadClasses');

// Reset localStorage before each test
beforeEach(() => {
  localStorage.clear();
});
