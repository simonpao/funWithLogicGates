// Test for state propagation when loading component specs
const { createMockCanvas, cleanupCanvas } = require('../helpers/testHelpers');

describe('Component Loading State Propagation', () => {
  let component;
  let canvas;
  let specs;

  beforeEach(() => {
    canvas = createMockCanvas('test-canvas', 1000, 600);
    component = new Component('test-canvas', Logger.logLvl.ERROR);
    specs = {};
  });

  afterEach(() => {
    cleanupCanvas(canvas);
  });

  test('should rebuild connection index when loading component spec', () => {
    // Create a simple circuit: AND -> OR
    component.items['and1'] = new And('and1', 100, 100);
    component.items['or1'] = new Or('or1', 150, 100);

    // Connect them
    component.establishNewConnection(component.items['and1'].outputs[0], component.items['or1'].inputs[0]);

    // Verify connection exists
    expect(component.connections.length).toBe(1);
    expect(component.connectionsByInput.size).toBe(1);

    // Save as spec
    const spec = new AbstractedComponentSpec(component, 'TestCircuit');
    specs['TestCircuit'] = spec;

    // Create new component - connection index starts empty
    const canvas2 = createMockCanvas('test-canvas-2', 1000, 600);
    const component2 = new Component('test-canvas-2', Logger.logLvl.ERROR);
    component2.specs = specs;
    component2.redrawCanvas = jest.fn(); // Stub out redraw to avoid canvas API issues
    
    // Before loading, index should be empty
    expect(component2.connectionsByInput.size).toBe(0);
    
    // Load the spec - this should rebuild the index
    component2.loadComponentSpec('TestCircuit', spec, false);

    // After loading, connection index should be rebuilt
    expect(component2.connectionsByInput).toBeInstanceOf(Map);
    expect(component2.connectionsByInput.size).toBeGreaterThan(0);
    expect(component2.connections.length).toBe(1);

    // Verify connections can be looked up with O(1)
    const firstConn = component2.connections[0];
    const found = component2.getConnectionsByInput(firstConn.input.id);
    expect(found).toBeInstanceOf(Array);
    expect(found).toContain(firstConn);
    
    cleanupCanvas(canvas2);
  });

  test('connection index enables fast lookups with multiple connections', () => {
    // Create multiple connections
    component.items['and1'] = new And('and1', 100, 100);
    component.items['or1'] = new Or('or1', 150, 100);
    component.items['not1'] = new Not('not1', 200, 100);

    // Connect: and1 -> or1, and1 -> or1 (second output), or1 -> not1
    component.establishNewConnection(component.items['and1'].outputs[0], component.items['or1'].inputs[0]);
    if (component.items['or1'].inputs.length > 1) {
      component.establishNewConnection(component.items['and1'].outputs[0], component.items['or1'].inputs[1]);
    }
    component.establishNewConnection(component.items['or1'].outputs[0], component.items['not1'].inputs[0]);

    const connectionCount = component.connections.length;
    expect(connectionCount).toBeGreaterThan(1);

    const spec = new AbstractedComponentSpec(component, 'IndexTest');
    specs['IndexTest'] = spec;

    const canvas2 = createMockCanvas('test-canvas-2', 1000, 600);
    const component2 = new Component('test-canvas-2', Logger.logLvl.ERROR);
    component2.specs = specs;
    component2.redrawCanvas = jest.fn(); // Stub out redraw
    component2.loadComponentSpec('IndexTest', spec, false);

    // Connection index should be built and usable
    expect(component2.connectionsByInput.size).toBeGreaterThan(0);
    expect(component2.connections.length).toBe(connectionCount);

    // Test fast lookup - get all connections for first gate's first input
    const testInputId = component2.items['or1'].inputs[0].id;
    const found = component2.getConnectionsByInput(testInputId);
    expect(found.length).toBeGreaterThan(0);
    
    cleanupCanvas(canvas2);
  });

  test('connection index should handle complex circuits after load', () => {
    // Create a chain of 5 gates
    for (let i = 1; i <= 5; i++) {
      component.items[`gate${i}`] = new And(`gate${i}`, 50 * i, 100);
    }

    // Connect them in a chain
    for (let i = 1; i < 5; i++) {
      component.establishNewConnection(
        component.items[`gate${i}`].outputs[0],
        component.items[`gate${i + 1}`].inputs[0]
      );
    }

    expect(component.connections.length).toBe(4);
    expect(component.connectionsByInput.size).toBe(4);

    const spec = new AbstractedComponentSpec(component, 'ChainCircuit');
    specs['ChainCircuit'] = spec;

    const canvas2 = createMockCanvas('test-canvas-2', 1000, 600);
    const component2 = new Component('test-canvas-2', Logger.logLvl.ERROR);
    component2.specs = specs;
    component2.redrawCanvas = jest.fn(); // Stub out redraw
    component2.loadComponentSpec('ChainCircuit', spec, false);

    // Index should be properly rebuilt
    expect(component2.connectionsByInput.size).toBe(4);
    expect(component2.connections.length).toBe(4);

    // Verify each connection can be looked up
    component2.connections.forEach(conn => {
      const found = component2.getConnectionsByInput(conn.input.id);
      expect(found).toContain(conn);
    });
    
    cleanupCanvas(canvas2);
  });
});
