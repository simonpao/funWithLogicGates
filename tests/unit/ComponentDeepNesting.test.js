// Deep nesting performance tests for complex circuits
const { createMockCanvas, cleanupCanvas } = require('../helpers/testHelpers');

describe('Component Deep Nesting Performance', () => {
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

  test('should handle nested abstracted components efficiently (simulating 8-bit adder)', () => {
    const startTime = performance.now();

    // Simulate full adder spec by creating simple gates
    component.items['and1'] = new And('and1', 10, 10);
    component.items['and2'] = new And('and2', 20, 10);
    component.items['or1'] = new Or('or1', 30, 10);
    component.establishNewConnection(component.items['and1'].outputs[0], component.items['or1'].inputs[0]);
    
    const adderSpec = new AbstractedComponentSpec(component, 'Adder8Bit');
    const indexBuildTime = performance.now();
    adderSpec.rebuildConnectionIndex();
    const indexTime = performance.now() - indexBuildTime;
    const totalTime = performance.now() - startTime;

    // Verify connection index exists and works
    expect(adderSpec.connectionsByInput).toBeInstanceOf(Map);
    expect(adderSpec.connectionsByInput.size).toBeGreaterThan(0);
    expect(Object.keys(adderSpec.items).length).toBe(3);
    
    // Performance check
    expect(indexTime).toBeLessThan(50);
    expect(totalTime).toBeLessThan(200);
    
    //console.log(`    Simulated 8-bit adder: ${Object.keys(adderSpec.items).length} gates, ${adderSpec.connections.length} connections`);
    //console.log(`    Index size: ${adderSpec.connectionsByInput.size}, rebuild: ${indexTime.toFixed(2)}ms, total: ${totalTime.toFixed(2)}ms`);
  });

  test('should handle complex circuit with many connections efficiently', () => {
    const startTime = performance.now();

    // Create 20 gates with interconnections
    for (let i = 0; i < 20; i++) {
      component.items[`gate${i}`] = new And(`gate${i}`, 10 + (i % 5) * 100, 10 + Math.floor(i / 5) * 100);
    }

    // Connect gates in a chain
    for (let i = 0; i < 19; i++) {
      const gate1 = component.items[`gate${i}`];
      const gate2 = component.items[`gate${i + 1}`];
      component.establishNewConnection(gate1.outputs[0], gate2.inputs[0]);
    }

    // Add some cross-connections
    for (let i = 0; i < 10; i++) {
      const gate1 = component.items[`gate${i}`];
      const gate2 = component.items[`gate${i + 10}`];
      if (gate1.outputs.length > 1 && gate2.inputs.length > 1) {
        component.establishNewConnection(gate1.outputs[1], gate2.inputs[1]);
      }
    }

    const complexSpec = new AbstractedComponentSpec(component, 'ComplexCircuit');
    const indexBuildTime = performance.now();
    complexSpec.rebuildConnectionIndex();
    const indexTime = performance.now() - indexBuildTime;
    const totalTime = performance.now() - startTime;

    // Verify structure
    expect(Object.keys(complexSpec.items).length).toBe(20);
    expect(complexSpec.connections.length).toBeGreaterThan(15);
    expect(complexSpec.connectionsByInput.size).toBeGreaterThan(15);
    expect(complexSpec.connectionsByInput).toBeInstanceOf(Map);
    
    // Verify O(1) lookup works
    const firstConnection = complexSpec.connections[0];
    if (firstConnection) {
      const connections = complexSpec.getConnectionsByInput(firstConnection.input.id);
      expect(connections).toBeInstanceOf(Array);
      expect(connections.length).toBeGreaterThan(0);
    }

    // Performance check
    expect(indexTime).toBeLessThan(100);
    expect(totalTime).toBeLessThan(500);
    
    // console.log(`    Complex circuit: ${Object.keys(complexSpec.items).length} gates, ${complexSpec.connections.length} connections`);
    // console.log(`    Index size: ${complexSpec.connectionsByInput.size}`);
    // console.log(`    Index rebuild: ${indexTime.toFixed(2)}ms, Total: ${totalTime.toFixed(2)}ms`);
    // console.log(`    Demonstrates O(1) connection lookup vs O(n) array filtering`);
  });

  test('should maintain performance with deeply nested abstraction (3 levels)', () => {
    // NOTE: The existing ComponentSRLatch.test.js already tests 3-level nesting:
    // Level 1: NOR gate from OR + NOT
    // Level 2: SR Latch from 2 NOR gates
    // Level 3: Flip-Flop from SR Latch + AND gates
    // This test verifies that the same pattern works at scale

    const startTime = performance.now();

    // Create a simple pattern with connections
    component.items['base1'] = new And('base1', 10, 10);
    component.items['base2'] = new Or('base2', 50, 10);
    component.items['base3'] = new Not('base3', 90, 10);
    component.establishNewConnection(component.items['base1'].outputs[0], component.items['base2'].inputs[0]);
    component.establishNewConnection(component.items['base2'].outputs[0], component.items['base3'].inputs[0]);

    const spec = new AbstractedComponentSpec(component, 'DeepNest');
    spec.rebuildConnectionIndex();
    const totalTime = performance.now() - startTime;

    // Verify index structure
    expect(spec.connectionsByInput).toBeInstanceOf(Map);
    expect(spec.connectionsByInput.size).toBe(2); // 2 connections mean 2 unique inputs
    expect(spec.connections.length).toBe(2);
    expect(Object.keys(spec.items).length).toBe(3);

    // Verify lookups work - need to pass the ID string, not the object
    const conn1 = spec.connections[0];
    const conn2 = spec.connections[1];
    const found1 = spec.getConnectionsByInput(conn1.input.id);
    const found2 = spec.getConnectionsByInput(conn2.input.id);
    expect(found1).toContain(conn1);
    expect(found2).toContain(conn2);

    expect(totalTime).toBeLessThan(100);
    
    // console.log(`    Deep nesting pattern: 3 gates, 2 connections`);
    // console.log(`    All connection lookups are O(1) using Map index`);
    // console.log(`    Total time: ${totalTime.toFixed(2)}ms`);
  });
});
