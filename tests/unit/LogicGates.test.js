// Classes are loaded in setup.js

describe('Logic Gates', () => {

  describe('And gate', () => {
    let andGate;

    beforeEach(() => {
      andGate = new And('and-1', 100, 100);
    });

    test('should inherit from Item', () => {
      expect(andGate).toBeInstanceOf(Item);
    });

    test('should have 2 outputs (input wires) and 1 input (output wire)', () => {
      expect(andGate.outputs).toHaveLength(2); // Gates receive via "outputs"
      expect(andGate.inputs).toHaveLength(1);   // Gates send via "inputs"
    });

    test('should return 0 when both inputs are 0', () => {
      andGate.outputs[0].state = 0;
      andGate.outputs[1].state = 0;
      andGate.determineInputState();
      expect(andGate.inputs[0].state).toBe(0);
    });

    test('should return 0 when one input is 1 and other is 0', () => {
      andGate.outputs[0].state = 1;
      andGate.outputs[1].state = 0;
      andGate.determineInputState();
      expect(andGate.inputs[0].state).toBe(0);
    });

    test('should return 1 when both inputs are 1', () => {
      andGate.outputs[0].state = 1;
      andGate.outputs[1].state = 1;
      andGate.determineInputState();
      expect(andGate.inputs[0].state).toBe(1);
    });
  });

  describe('Or gate', () => {
    let orGate;

    beforeEach(() => {
      orGate = new Or('or-1', 100, 100);
    });

    test('should inherit from Item', () => {
      expect(orGate).toBeInstanceOf(Item);
    });

    test('should have 2 outputs (input wires) and 1 input (output wire)', () => {
      expect(orGate.outputs).toHaveLength(2); // Gates receive via "outputs"
      expect(orGate.inputs).toHaveLength(1);   // Gates send via "inputs"
    });

    test('should return 0 when both inputs are 0', () => {
      orGate.outputs[0].state = 0;
      orGate.outputs[1].state = 0;
      orGate.determineInputState();
      expect(orGate.inputs[0].state).toBe(0);
    });

    test('should return 1 when one input is 1 and other is 0', () => {
      orGate.outputs[0].state = 1;
      orGate.outputs[1].state = 0;
      orGate.determineInputState();
      expect(orGate.inputs[0].state).toBe(1);
    });

    test('should return 1 when both inputs are 1', () => {
      orGate.outputs[0].state = 1;
      orGate.outputs[1].state = 1;
      orGate.determineInputState();
      expect(orGate.inputs[0].state).toBe(1);
    });
  });

  describe('Not gate', () => {
    let notGate;

    beforeEach(() => {
      notGate = new Not('not-1', 100, 100);
    });

    test('should inherit from Item', () => {
      expect(notGate).toBeInstanceOf(Item);
    });

    test('should have 1 input and 1 output', () => {
      expect(notGate.inputs).toHaveLength(1);
      expect(notGate.outputs).toHaveLength(1);
    });

    test('should return 1 when input is 0', () => {
      notGate.outputs[0].state = 0;
      notGate.determineInputState();
      expect(notGate.inputs[0].state).toBe(1);
    });

    test('should return 0 when input is 1', () => {
      notGate.outputs[0].state = 1;
      notGate.determineInputState();
      expect(notGate.inputs[0].state).toBe(0);
    });
  });
});
