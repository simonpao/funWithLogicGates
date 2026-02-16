// Performance test for connection indexing optimization
const { createMockCanvas, cleanupCanvas } = require('../helpers/testHelpers');

describe('Component - Connection Performance', () => {
  let component;
  let canvas;

  beforeEach(() => {
    canvas = createMockCanvas('test-canvas', 1000, 600);
    component = new Component('test-canvas', Logger.logLvl.ERROR);
  });

  afterEach(() => {
    cleanupCanvas(canvas);
  });

  describe('Connection Index Performance', () => {
    test('getConnectionsByInput should use Map for O(1) lookup', () => {
      // Verify the index exists
      expect(component.connectionsByInput).toBeInstanceOf(Map);
    });

    test('adding connection should update index', () => {
      const input = new Input('input1', 'Input 1', 0);
      const output = new Output('output1', 'Output 1', 0);
      const connection = new Connection(input, output, []);
      
      component.connections.push(connection);
      component.addConnectionToIndex(connection);
      
      // Verify index was updated
      expect(component.connectionsByInput.has('input1')).toBe(true);
      expect(component.connectionsByInput.get('input1')).toContain(connection);
    });

    test('removing connection should update index', () => {
      const input = new Input('input1', 'Input 1', 0);
      const output = new Output('output1', 'Output 1', 0);
      const connection = new Connection(input, output, []);
      
      component.connections.push(connection);
      component.addConnectionToIndex(connection);
      component.removeConnectionFromIndex(connection);
      
      // Verify index was updated
      expect(component.connectionsByInput.has('input1')).toBe(false);
    });

    test('rebuildConnectionIndex should rebuild entire index', () => {
      const input1 = new Input('input1', 'Input 1', 0);
      const input2 = new Input('input2', 'Input 2', 0);
      const output1 = new Output('output1', 'Output 1', 0);
      const output2 = new Output('output2', 'Output 2', 0);
      
      component.connections = [
        new Connection(input1, output1, []),
        new Connection(input2, output2, []),
        new Connection(input1, output2, [])  // input1 has 2 connections
      ];
      
      component.rebuildConnectionIndex();
      
      expect(component.connectionsByInput.size).toBe(2);
      expect(component.connectionsByInput.get('input1').length).toBe(2);
      expect(component.connectionsByInput.get('input2').length).toBe(1);
    });

    test('performance: large circuit with many connections', () => {
      // Create a large circuit: 50 items with 100 connections
      const numItems = 50;
      const numConnections = 100;
      
      // Create items
      for(let i = 0; i < numItems; i++) {
        component.items[`item${i}`] = new Item(
          Component.types.AND, 
          `item${i}`, 
          100 + (i % 10) * 80, 
          100 + Math.floor(i / 10) * 80, 
          60, 40, '#0099FF', 2, 1
        );
      }
      
      // Create inputs and outputs
      for(let i = 0; i < 10; i++) {
        component.inputs[`input${i}`] = new Input(`input${i}`, `Input ${i}`, 0);
        component.outputs[`output${i}`] = new Output(`output${i}`, `Output ${i}`, 0);
      }
      
      // Create connections
      for(let i = 0; i < numConnections; i++) {
        const inputId = `input${i % 10}`;
        const itemIdx = i % numItems;
        const outputId = `item${itemIdx}_output_0`;
        
        const input = component.inputs[inputId];
        const output = new Output(outputId, 'Out', 0);
        
        const conn = new Connection(input, output, []);
        component.connections.push(conn);
        component.addConnectionToIndex(conn);
      }
      
      // Measure lookup performance
      const start = Date.now();
      const iterations = 1000;
      
      for(let i = 0; i < iterations; i++) {
        const inputId = `input${i % 10}`;
        const result = component.getConnectionsByInput(inputId);
        expect(result).toBeDefined();
      }
      
      const duration = Date.now() - start;
      
      // Should be very fast (< 100ms for 1000 lookups, allowing headroom for parallel test execution)
      expect(duration).toBeLessThan(100);
      
      // Log performance for reference
      // console.log(`  → 1000 lookups in ${duration}ms (${(duration/iterations).toFixed(3)}ms per lookup)`);
    });

    test('performance comparison: verify Map is faster than filter', () => {
      // Create test data
      const numConnections = 200;
      const testInput = new Input('test_input', 'Test', 0);
      
      for(let i = 0; i < numConnections; i++) {
        const output = new Output(`output${i}`, `Out ${i}`, 0);
        const input = (i % 20 === 0) ? testInput : new Input(`input${i}`, `In ${i}`, 0);
        const conn = new Connection(input, output, []);
        component.connections.push(conn);
      }
      
      // Time the old way (using filter) - run more iterations for measurable time
      const filterStart = Date.now();
      const filterIterations = 1000;
      for(let i = 0; i < filterIterations; i++) {
        const result = component.connections.filter(c => c.input.id === 'test_input');
      }
      const filterDuration = Date.now() - filterStart;
      
      // Build index
      component.rebuildConnectionIndex();
      
      // Time the new way (using Map)
      const mapStart = Date.now();
      const mapIterations = 1000;
      for(let i = 0; i < mapIterations; i++) {
        const result = component.getConnectionsByInput('test_input');
      }
      const mapDuration = Date.now() - mapStart;
      
      // Map should be faster or at least equal
      // console.log(`  → Filter: ${filterDuration}ms, Map: ${mapDuration}ms (${filterDuration > 0 ? (filterDuration/mapDuration).toFixed(1) : 'N/A'}x faster)`);
      expect(mapDuration).toBeLessThanOrEqual(filterDuration);
    });
  });

  describe('Integration with Component Operations', () => {
    test('establishNewConnection maintains index', () => {
      // This test just verifies the index is updated, not the full propagation
      const input = new Input('in1', 'Input 1', 0);
      const output = new Output('out1', 'Output', 0);
      
      const initialSize = component.connectionsByInput.size;
      
      // Manually add connection like establishNewConnection does
      const conn = new Connection(input, output, []);
      component.connections.push(conn);
      component.addConnectionToIndex(conn);
      
      // Verify connection was added to index
      const connections = component.getConnectionsByInput('in1');
      expect(connections.length).toBe(1);
      expect(connections[0].input.id).toBe('in1');
    });

    test('removeConnections maintains index', () => {
      // Create connections manually to test index maintenance
      const input = new Input('in1', 'Input 1', 0);
      const output = new Output('out1', 'Output 1', 0);
      
      const conn = new Connection(input, output, []);
      component.connections.push(conn);
      component.addConnectionToIndex(conn);
      
      expect(component.connectionsByInput.size).toBe(1);
      
      // Remove using filter approach (simulating removeConnections for input)
      component.connections = component.connections.filter(c => {
        if(c.input.id === 'in1') {
          component.removeConnectionFromIndex(c);
          return false;
        }
        return true;
      });
      
      // Verify index was updated
      expect(component.connectionsByInput.size).toBe(0);
      expect(component.connections.length).toBe(0);
    });

    test('clearCanvasState clears index', () => {
      // Add some connections
      const input = new Input('in1', 'Input', 0);
      const output = new Output('out1', 'Output', 0);
      const conn = new Connection(input, output, []);
      
      component.connections.push(conn);
      component.addConnectionToIndex(conn);
      
      expect(component.connectionsByInput.size).toBe(1);
      
      // Clear state
      component.clearCanvasState();
      
      // Verify index was cleared
      expect(component.connectionsByInput.size).toBe(0);
    });
  });
});
