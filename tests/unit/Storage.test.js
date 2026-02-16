// Classes are loaded in setup.js (using FWLGStorage alias to avoid jsdom conflict)

describe('Storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('constructor', () => {
    test('should create storage with a key', () => {
      const storage = new FWLGStorage('test-key');
      expect(storage.key).toBe('test-key');
    });
  });

  describe('setObject and getObject', () => {
    let storage;

    beforeEach(() => {
      storage = new FWLGStorage('test');
    });

    test('should store and retrieve an object without name', () => {
      const testObj = { foo: 'bar', count: 42 };
      const result = storage.setObject(testObj);
      
      expect(result).toBe(true);
      
      const retrieved = storage.getObject();
      expect(retrieved).toEqual(testObj);
    });

    test('should store and retrieve an object with name', () => {
      const testObj = { data: 'test-data' };
      const result = storage.setObject(testObj, 'my-save');
      
      expect(result).toBe(true);
      
      const retrieved = storage.getObject('my-save');
      expect(retrieved).toEqual(testObj);
    });

    test('should return empty object for non-existent key', () => {
      const retrieved = storage.getObject('does-not-exist');
      expect(retrieved).toEqual({});
    });

    test('should use correct localStorage key format', () => {
      const testObj = { test: true };
      storage.setObject(testObj);
      
      const key = 'fun-with-logic-gates--test';
      const rawValue = localStorage.getItem(key);
      expect(rawValue).toBe(JSON.stringify(testObj));
    });

    test('should use correct localStorage key format with name', () => {
      const testObj = { test: true };
      storage.setObject(testObj, 'save1');
      
      const key = 'fun-with-logic-gates--test--save1';
      const rawValue = localStorage.getItem(key);
      expect(rawValue).toBe(JSON.stringify(testObj));
    });

    test('should handle complex nested objects', () => {
      const complexObj = {
        items: [{ id: 1 }, { id: 2 }],
        metadata: { created: Date.now() },
        config: { enabled: true }
      };
      
      storage.setObject(complexObj);
      const retrieved = storage.getObject();
      
      expect(retrieved).toEqual(complexObj);
    });
  });

  describe('deleteObject', () => {
    let storage;

    beforeEach(() => {
      storage = new FWLGStorage('test');
    });

    test('should delete object without name', () => {
      storage.setObject({ data: 'test' });
      const result = storage.deleteObject();
      
      expect(result).toBe(true);
      
      const retrieved = storage.getObject();
      expect(retrieved).toEqual({});
    });

    test('should delete object with name', () => {
      storage.setObject({ data: 'test' }, 'save1');
      const result = storage.deleteObject('save1');
      
      expect(result).toBe(true);
      
      const retrieved = storage.getObject('save1');
      expect(retrieved).toEqual({});
    });

    test('should not affect other stored objects', () => {
      storage.setObject({ data: 'save1' }, 'save1');
      storage.setObject({ data: 'save2' }, 'save2');
      
      storage.deleteObject('save1');
      
      expect(storage.getObject('save1')).toEqual({});
      expect(storage.getObject('save2')).toEqual({ data: 'save2' });
    });
  });

  describe('last-updated tracking', () => {
    let storage;

    beforeEach(() => {
      storage = new FWLGStorage('test');
      // Clear the last-updated timestamp
      localStorage.removeItem('fun-with-logic-gates--last-updated');
    });

    test('should set last-updated timestamp on setObject', () => {
      const beforeTime = Date.now();
      storage.setObject({ test: true });
      const afterTime = Date.now();
      
      const lastUpdated = localStorage.getItem('fun-with-logic-gates--last-updated');
      const timestamp = parseInt(lastUpdated);
      
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });

    test('should set last-updated timestamp on deleteObject', () => {
      storage.setObject({ test: true });
      
      const beforeTime = Date.now();
      storage.deleteObject();
      const afterTime = Date.now();
      
      const lastUpdated = localStorage.getItem('fun-with-logic-gates--last-updated');
      const timestamp = parseInt(lastUpdated);
      
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });
  });
});
