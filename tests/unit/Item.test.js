// Classes are loaded in setup.js

describe('Item', () => {

  describe('constructor', () => {
    test('should create an item with basic properties', () => {
      const item = new Item('gate', 'gate-1', 100, 150, 60, 40, '#0099FF', 2, 1);
      
      expect(item.type).toBe('gate');
      expect(item.id).toBe('gate-1');
      expect(item.x).toBe(100);
      expect(item.y).toBe(150);
      expect(item.w).toBe(60);
      expect(item.h).toBe(40);
      expect(item.color).toBe('#0099FF');
    });

    test('should create correct number of inputs', () => {
      const item = new Item('gate', 'gate-1', 0, 0, 60, 40, '#0099FF', 3, 1);
      
      expect(item.inputs).toHaveLength(3);
      expect(item.inputs[0].id).toBe('gate-1_in_0');
      expect(item.inputs[1].id).toBe('gate-1_in_1');
      expect(item.inputs[2].id).toBe('gate-1_in_2');
    });

    test('should create correct number of outputs', () => {
      const item = new Item('gate', 'gate-1', 0, 0, 60, 40, '#0099FF', 2, 2);
      
      expect(item.outputs).toHaveLength(2);
      expect(item.outputs[0].id).toBe('gate-1_out_0');
      expect(item.outputs[1].id).toBe('gate-1_out_1');
    });

    test('should handle zero inputs and outputs', () => {
      const item = new Item('rect', 'rect-1', 0, 0, 60, 40, '#0099FF', 0, 0);
      
      expect(item.inputs).toHaveLength(0);
      expect(item.outputs).toHaveLength(0);
    });
  });

  describe('getInput', () => {
    let item;

    beforeEach(() => {
      item = new Item('gate', 'gate-1', 0, 0, 60, 40, '#0099FF', 2, 1);
    });

    test('should return input at valid index', () => {
      const input = item.getInput(0);
      expect(input).toBeTruthy();
      expect(input.id).toBe('gate-1_in_0');
    });

    test('should return false for out of bounds index', () => {
      const input = item.getInput(5);
      expect(input).toBe(false);
    });

    test('should return false for negative index', () => {
      const input = item.getInput(-1);
      expect(input).toBeFalsy(); // Returns undefined (falsy) for invalid index
    });
  });

  describe('getOutput', () => {
    let item;

    beforeEach(() => {
      item = new Item('gate', 'gate-1', 0, 0, 60, 40, '#0099FF', 2, 2);
    });

    test('should return output at valid index', () => {
      const output = item.getOutput(1);
      expect(output).toBeTruthy();
      expect(output.id).toBe('gate-1_out_1');
    });

    test('should return false for out of bounds index', () => {
      const output = item.getOutput(3);
      expect(output).toBe(false);
    });

    test('should return false for negative index', () => {
      const output = item.getOutput(-1);
      expect(output).toBeFalsy(); // Returns undefined (falsy) for invalid index
    });
  });
});
