# Testing Guide

## Running Tests

```bash
# Run all tests
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test tests/unit/Item.test.js
npm test tests/unit/ComponentCollision.test.js

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

## Writing Unit Tests

### Using Test Helpers

The `tests/helpers/testHelpers.js` module provides utilities for testing:

```javascript
const { createMockCanvas, cleanupCanvas, createTestItem, createMockIO } = require('../helpers/testHelpers');

describe('Component Tests', () => {
  let component;
  let canvas;

  beforeEach(() => {
    canvas = createMockCanvas('test-canvas', 1000, 600);
    component = new Component('test-canvas', Logger.logLvl.ERROR);
  });

  afterEach(() => {
    cleanupCanvas(canvas);
  });

  test('should do something', () => {
    expect(component).toBeDefined();
  });
});
```

### Basic Template

```javascript
// Classes are loaded in setup.js - no imports needed

describe('ClassName', () => {
  describe('method name', () => {
    test('should do something', () => {
      const instance = new ClassName(args);
      expect(instance.property).toBe(expected);
    });
  });
});
```

### Important Conventions

#### 1. Storage Class Naming
Use `FWLGStorage` instead of `Storage` to avoid conflicts with jsdom:

```javascript
describe('Storage', () => {
  test('should create storage', () => {
    const storage = new FWLGStorage('my-key');  // Not new Storage()
    expect(storage.key).toBe('my-key');
  });
});
```

#### 2. Gate I/O Naming (Reversed!)
In this codebase, `inputs` and `outputs` are reversed from typical expectations:
- `item.outputs[]` = connections coming INTO the item
- `item.inputs[]` = connections going OUT OF the item

```javascript
test('AND gate structure', () => {
  const gate = new And('and-1', 100, 100);
  expect(gate.outputs).toHaveLength(2); // Gate RECEIVES via 2 outputs
  expect(gate.inputs).toHaveLength(1);  // Gate PRODUCES via 1 input
});
```

#### 3. Mocked Functions
`console.error` and `console.warn` are mocked in `setup.js` to reduce noise. Use Jest matchers to verify:

```javascript
test('should log error', () => {
  logger.error('message');
  expect(console.error).toHaveBeenCalled();
});
```

### Common Patterns

#### Testing with localStorage
```javascript
beforeEach(() => {
  localStorage.clear(); // Automatically called, but can be explicit
});

test('should persist to localStorage', () => {
  storage.setObject({ data: 'test' });
  const key = 'fun-with-logic-gates--test';
  expect(localStorage.getItem(key)).toBeTruthy();
});
```

#### Testing Logic Gates
```javascript
test('AND gate logic', () => {
  const gate = new And('and-1', 0, 0);
  gate.outputs[0].state = 1;  // Set first input
  gate.outputs[1].state = 1;  // Set second input
  gate.determineInputState(); // Calculate output
  expect(gate.inputs[0].state).toBe(1); // Check result
});
```

## Adding New Tests

1. **Create test file** in `tests/unit/YourClass.test.js`
2. **No imports needed** - all classes are pre-loaded
3. **Follow naming convention**: `ClassName.test.js`
4. **Group related tests** using `describe()` blocks
5. **Use descriptive test names** starting with "should"

## Debugging Tests

### Run specific test
```bash
npm test -- --testNamePattern="should create storage"
```

### See full console output
Comment out the console mocking in `tests/setup.js`:

```javascript
// Mock console methods to reduce noise
global.console = {
  ...console,
  // error: jest.fn(),  // Comment out to see errors
  // warn: jest.fn(),    // Comment out to see warnings
  log: console.log,
  debug: console.debug
};
```

### Check coverage
```bash
npm run test:coverage
open coverage/index.html  # View HTML report
```

