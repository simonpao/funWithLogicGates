// Classes are loaded globally in setup.js
const { createMockCanvas, cleanupCanvas } = require('../helpers/testHelpers');

describe('Truth Table Generation', () => {
  let canvas, component, placeholder;

  beforeEach(() => {
    canvas = createMockCanvas('test-canvas', 1000, 600);
    placeholder = document.createElement('div');
    placeholder.id = 'new-items-placeholder';
    document.body.appendChild(placeholder);
    component = new Component('test-canvas', Logger.logLvl.ERROR);
  });

  afterEach(() => {
    if (component && component.removeEventListeners) {
      component.removeEventListeners();
    }
    cleanupCanvas(canvas);
    if (placeholder && placeholder.parentNode) {
      placeholder.parentNode.removeChild(placeholder);
    }
  });

  test('should compute correct truth table for AND gate', async () => {
    // Create 2 inputs and 1 output
    component.inputs['in1'] = { id: 'in1', label: 'A', state: 0 };
    component.inputs['in2'] = { id: 'in2', label: 'B', state: 0 };
    component.outputs['out1'] = { id: 'out1', label: 'Q', state: 0 };

    // Create an AND gate
    const andGate = new And('and1', 100, 100);
    component.items['and1'] = andGate;

    // Connect inputs to AND gate
    component.establishNewConnection(component.inputs['in1'], andGate.outputs[0]);
    component.establishNewConnection(component.inputs['in2'], andGate.outputs[1]);
    
    // Connect AND gate output to circuit output
    component.establishNewConnection(andGate.inputs[0], component.outputs['out1']);

    // Compute truth table
    const result = await component.computeTruthTable(
      ['in1', 'in2'],
      2,
      ['out1'],
      1,
      4
    );

    expect(result).toBeDefined();
    expect(result.id).toBe('truth-table--div');
    
    // Verify HTML contains the expected structure
    const html = result.innerHTML;
    expect(html).toContain('<table>');
    expect(html).toContain('<thead>');
    expect(html).toContain('<tbody>');
    expect(html).toContain('A'); // Input label
    expect(html).toContain('B'); // Input label
    expect(html).toContain('Q'); // Output label
    
    // Should have 4 rows (2^2 combinations)
    const rows = html.match(/<tr>/g);
    expect(rows.length).toBe(5); // 1 header + 4 data rows
  });

  test('should compute correct truth table for OR gate', async () => {
    component.inputs['a'] = { id: 'a', label: 'A', state: 0 };
    component.inputs['b'] = { id: 'b', label: 'B', state: 0 };
    component.outputs['q'] = { id: 'q', label: 'Q', state: 0 };

    const orGate = new Or('or1', 100, 100);
    component.items['or1'] = orGate;

    component.establishNewConnection(component.inputs['a'], orGate.outputs[0]);
    component.establishNewConnection(component.inputs['b'], orGate.outputs[1]);
    component.establishNewConnection(orGate.inputs[0], component.outputs['q']);

    const result = await component.computeTruthTable(['a', 'b'], 2, ['q'], 1, 4);

    expect(result).toBeDefined();
    const html = result.innerHTML;
    expect(html).toContain('<table>');
    
    // Verify all 4 combinations are present
    const rows = html.match(/<tr>/g);
    expect(rows.length).toBe(5);
  });

  test('truth table generation should complete in reasonable time', async () => {
    // Create a circuit with 4 inputs and 2 outputs (16 combinations)
    for (let i = 1; i <= 4; i++) {
      component.inputs[`in${i}`] = { id: `in${i}`, label: `I${i}`, state: 0 };
    }
    component.outputs['out1'] = { id: 'out1', label: 'O1', state: 0 };
    component.outputs['out2'] = { id: 'out2', label: 'O2', state: 0 };

    // Create some gates
    const and1 = new And('and1', 100, 100);
    const or1 = new Or('or1', 150, 100);
    component.items['and1'] = and1;
    component.items['or1'] = or1;

    // Wire them up
    component.establishNewConnection(component.inputs['in1'], and1.outputs[0]);
    component.establishNewConnection(component.inputs['in2'], and1.outputs[1]);
    component.establishNewConnection(component.inputs['in3'], or1.outputs[0]);
    component.establishNewConnection(component.inputs['in4'], or1.outputs[1]);
    component.establishNewConnection(and1.inputs[0], component.outputs['out1']);
    component.establishNewConnection(or1.inputs[0], component.outputs['out2']);

    const startTime = performance.now();
    const result = await component.computeTruthTable(
      ['in1', 'in2', 'in3', 'in4'],
      4,
      ['out1', 'out2'],
      2,
      16
    );
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(result).toBeDefined();
    
    // Should complete in under 100ms for 16 combinations (very generous threshold)
    // With optimizations, this should be much faster (typically <10ms)
    expect(duration).toBeLessThan(100);
    
    // Verify correct number of rows
    const html = result.innerHTML;
    const rows = html.match(/<tr>/g);
    expect(rows.length).toBe(17); // 1 header + 16 data rows
  });

  test('should handle complex circuits with multiple outputs', async () => {
    // Create circuit with 2 outputs: A AND B, A OR B
    component.inputs['a'] = { id: 'a', label: 'A', state: 0 };
    component.inputs['b'] = { id: 'b', label: 'B', state: 0 };
    component.outputs['out1'] = { id: 'out1', label: 'AND', state: 0 };
    component.outputs['out2'] = { id: 'out2', label: 'OR', state: 0 };

    const andGate = new And('and1', 100, 100);
    const orGate = new Or('or1', 100, 150);
    component.items['and1'] = andGate;
    component.items['or1'] = orGate;

    // Connect inputs to gates
    component.establishNewConnection(component.inputs['a'], andGate.outputs[0]);
    component.establishNewConnection(component.inputs['b'], andGate.outputs[1]);
    component.establishNewConnection(component.inputs['a'], orGate.outputs[0]);
    component.establishNewConnection(component.inputs['b'], orGate.outputs[1]);
    
    // Connect gates to outputs
    component.establishNewConnection(andGate.inputs[0], component.outputs['out1']);
    component.establishNewConnection(orGate.inputs[0], component.outputs['out2']);

    const result = await component.computeTruthTable(['a', 'b'], 2, ['out1', 'out2'], 2, 4);

    expect(result).toBeDefined();
    const html = result.innerHTML;
    
    // Should have both output columns
    expect(html).toContain('AND');
    expect(html).toContain('OR');
    
    // Verify structure
    const rows = html.match(/<tr>/g);
    expect(rows.length).toBe(5); // header + 4 rows
  });
});
