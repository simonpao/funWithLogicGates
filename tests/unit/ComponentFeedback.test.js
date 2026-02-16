// Test for feedback loop functionality with connection indexing
const { createMockCanvas, cleanupCanvas } = require('../helpers/testHelpers');

describe('Component - Feedback Loops & Connection Index', () => {
  let component;
  let canvas;

  beforeEach(() => {
    canvas = createMockCanvas('test-canvas', 1000, 600);
    component = new Component('test-canvas', Logger.logLvl.ERROR);
  });

  afterEach(() => {
    cleanupCanvas(canvas);
  });

  describe('Connection Index Behavior', () => {
    test('rebuildConnectionIndex should handle array', () => {
      const input1 = new Input('in1', 'Input 1', 0);
      const output1 = new Output('out1', 'Output 1', 0);
      const input2 = new Input('in2', 'Input 2', 0);
      const output2 = new Output('out2', 'Output 2', 0);
      
      // Create connections as array
      component.connections = [
        new Connection(input1, output1, []),
        new Connection(input2, output2, [])
      ];
      
      component.rebuildConnectionIndex();
      
      expect(component.connectionsByInput.size).toBe(2);
      expect(component.getConnectionsByInput('in1').length).toBe(1);
      expect(component.getConnectionsByInput('in2').length).toBe(1);
    });

    test('rebuildConnectionIndex should handle object with numeric keys (from deserialization)', () => {
      const input1 = new Input('in1', 'Input 1', 0);
      const output1 = new Output('out1', 'Output 1', 0);
      const input2 = new Input('in2', 'Input 2', 0);
      const output2 = new Output('out2', 'Output 2', 0);
      
      // Simulate deserialization where connections is object-like
      component.connections = {};
      component.connections[0] = new Connection(input1, output1, []);
      component.connections[1] = new Connection(input2, output2, []);
      
      // Should handle both array and object iterations
      expect(() => {
        component.rebuildConnectionIndex();
      }).not.toThrow();
      
      expect(component.connectionsByInput.size).toBe(2);
    });

    test('should handle feedback connections (output feeding back to input)', () => {
      // Create an AND gate
      component.items['and1'] = new And('and1', 200, 200);
      
      // Create feedback: gate output back to one of its inputs
      // Remember: item.outputs[] are inputs, item.inputs[] are outputs
      const conn = new Connection(
        component.items['and1'].inputs[0],      // Gate's output port
        component.items['and1'].outputs[1],     // Gate's second input port
        []
      );
      
      component.connections.push(conn);
      component.addConnectionToIndex(conn);
      
      // Should be able to find feedback connection
      const found = component.getConnectionsByInput(component.items['and1'].inputs[0].id);
      expect(found.length).toBe(1);
      expect(found[0]).toBe(conn);
    });

    test('should allow multiple gates with cross-connections', () => {
      component.items['and1'] = new And('and1', 200, 200);
      component.items['or1'] = new Or('or1', 300, 200);
      
      // Cross-connect: AND output -> OR input, OR output -> AND input
      const conn1 = new Connection(
        component.items['and1'].inputs[0],      // AND output
        component.items['or1'].outputs[0],      // OR input
        []
      );
      const conn2 = new Connection(
        component.items['or1'].inputs[0],       // OR output
        component.items['and1'].outputs[0],     // AND input
        []
      );
      
      component.connections.push(conn1, conn2);
      component.addConnectionToIndex(conn1);
      component.addConnectionToIndex(conn2);
      
      expect(component.connections.length).toBe(2);
      expect(component.connectionsByInput.size).toBe(2);
      
      // Verify both connections are indexed
      expect(component.getConnectionsByInput(component.items['and1'].inputs[0].id).length).toBe(1);
      expect(component.getConnectionsByInput(component.items['or1'].inputs[0].id).length).toBe(1);
    });

    test('propagation should not cause infinite loop with feedback', () => {
      component.items['and1'] = new And('and1', 200, 200);
      component.inputs['in1'] = new Input('in1', 'Input', 0);
      
      // Connect input to AND
      const conn1 = new Connection(
        component.inputs['in1'],
        component.items['and1'].outputs[0],
        []
      );
      component.connections.push(conn1);
      component.addConnectionToIndex(conn1);
      
      // Create feedback loop
      const conn2 = new Connection(
        component.items['and1'].inputs[0],
        component.items['and1'].outputs[1],
        []
      );
      component.connections.push(conn2);
      component.addConnectionToIndex(conn2);
      
      // Should not throw (propagating array prevents infinite loops)
      expect(() => {
        component.propagateState(component.inputs['in1']);
      }).not.toThrow();
    });

    test('should work correctly after loading state with feedback loops', () => {
      component.items['and1'] = new And('and1', 200, 200);
      component.items['or1'] = new Or('or1', 300, 200);
      
      // Create some connections
      const connections = {
        0: new Connection(component.items['and1'].inputs[0], component.items['or1'].outputs[0], []),
        1: new Connection(component.items['or1'].inputs[0], component.items['and1'].outputs[0], [])
      };
      
      component.connections = connections;
      component.rebuildConnectionIndex();
      
      // After rebuild, lookups should work
      expect(component.getConnectionsByInput(component.items['and1'].inputs[0].id).length).toBe(1);
      expect(component.getConnectionsByInput(component.items['or1'].inputs[0].id).length).toBe(1);
      
      // Propagation should still work
      expect(() => {
        component.propagateStates(component.inputs);
      }).not.toThrow();
    });
  });
});
