// Full SR Latch test - NOR from OR+NOT, SR latch from 2 NORs, flip-flop
const { createMockCanvas, cleanupCanvas } = require('../helpers/testHelpers');

describe('Component - SR Latch & Flip-Flop Integration', () => {
  let component;
  let canvas;
  let specs;

  beforeEach(() => {
    canvas = createMockCanvas('test-canvas', 1000, 600);
    specs = {};
    component = new Component('test-canvas', Logger.logLvl.ERROR);
  });

  afterEach(() => {
    cleanupCanvas(canvas);
  });

  describe('Step 1: NOR gate from OR and NOT', () => {
    test('should create and test NOR logic', () => {
      component.items['or1'] = new Or('or1', 200, 200);
      component.items['not1'] = new Not('not1', 300, 200);
      component.inputs['in1'] = new Input('in1', 'Input 1', 0);
      component.inputs['in2'] = new Input('in2', 'Input 2', 0);
      component.outputs['out1'] = new Output('out1', 'Output 1', 0);
      
      let conn = new Connection(component.inputs['in1'], component.items['or1'].outputs[0], []);
      component.connections.push(conn);
      component.addConnectionToIndex(conn);
      
      conn = new Connection(component.inputs['in2'], component.items['or1'].outputs[1], []);
      component.connections.push(conn);
      component.addConnectionToIndex(conn);
      
      conn = new Connection(component.items['or1'].inputs[0], component.items['not1'].outputs[0], []);
      component.connections.push(conn);
      component.addConnectionToIndex(conn);
      
      conn = new Connection(component.items['not1'].inputs[0], component.outputs['out1'], []);
      component.connections.push(conn);
      component.addConnectionToIndex(conn);
      
      expect(component.connections.length).toBe(4);
      
      // Test NOR truth table
      const tests = [
        [0, 0, 1], [1, 0, 0], [0, 1, 0], [1, 1, 0]
      ];
      
      for(const [in1, in2, expected] of tests) {
        component.inputs['in1'].state = in1;
        component.inputs['in2'].state = in2;
        component.propagateStates(component.inputs);
        expect(component.outputs['out1'].state).toBe(expected);
      }
    });
    
    test('should save NOR as spec', () => {
      component.items['or1'] = new Or('or1', 200, 200);
      component.items['not1'] = new Not('not1', 300, 200);
      component.inputs['A'] = new Input('A', 'A', 0);
      component.inputs['B'] = new Input('B', 'B', 0);
      component.outputs['Q'] = new Output('Q', 'Q', 0);
      
      component.connections = [];
      component.connectionsByInput.clear();
      
      let conn = new Connection(component.inputs['A'], component.items['or1'].outputs[0], []);
      component.connections.push(conn);
      component.addConnectionToIndex(conn);
      
      conn = new Connection(component.inputs['B'], component.items['or1'].outputs[1], []);
      component.connections.push(conn);
      component.addConnectionToIndex(conn);
      
      conn = new Connection(component.items['or1'].inputs[0], component.items['not1'].outputs[0], []);
      component.connections.push(conn);
      component.addConnectionToIndex(conn);
      
      conn = new Connection(component.items['not1'].inputs[0], component.outputs['Q'], []);
      component.connections.push(conn);
      component.addConnectionToIndex(conn);
      
      const norSpec = new AbstractedComponentSpec(component, 'NOR');
      norSpec.rebuildConnectionIndex();
      
      expect(norSpec.name).toBe('NOR');
      expect(norSpec.connectionsByInput).toBeInstanceOf(Map);
      expect(norSpec.connectionsByInput.size).toBeGreaterThan(0);
    });
  });

  describe('Step 2: SR Latch from two NOR gates', () => {
    test('should create SR latch with feedback', () => {
      // Create NOR spec
      const norComp = new Component('test-canvas', Logger.logLvl.ERROR);
      norComp.items['or1'] = new Or('or1', 0, 0);
      norComp.items['not1'] = new Not('not1', 0, 0);
      norComp.inputs['A'] = new Input('A', 'A', 0);
      norComp.inputs['B'] = new Input('B', 'B', 0);
      norComp.outputs['Q'] = new Output('Q', 'Q', 0);
      
      norComp.connections = [];
      let conn = new Connection(norComp.inputs['A'], norComp.items['or1'].outputs[0], []);
      norComp.connections.push(conn);
      norComp.addConnectionToIndex(conn);
      
      conn = new Connection(norComp.inputs['B'], norComp.items['or1'].outputs[1], []);
      norComp.connections.push(conn);
      norComp.addConnectionToIndex(conn);
      
      conn = new Connection(norComp.items['or1'].inputs[0], norComp.items['not1'].outputs[0], []);
      norComp.connections.push(conn);
      norComp.addConnectionToIndex(conn);
      
      conn = new Connection(norComp.items['not1'].inputs[0], norComp.outputs['Q'], []);
      norComp.connections.push(conn);
      norComp.addConnectionToIndex(conn);
      
      const norSpec = new AbstractedComponentSpec(norComp, 'NOR');
      norSpec.rebuildConnectionIndex();
      specs['NOR'] = norSpec;
      
      // Create SR latch
      component.items = {};
      component.inputs = {};
      component.outputs = {};
      component.connections = [];
      component.connectionsByInput.clear();
      
      component.items['nor1'] = new AbstractedComponent(
        'NOR', Component.types.NOR, specs['NOR'], specs,
        'nor1', 200, 200, 80, 60, '#0099FF'
      );
      component.items['nor2'] = new AbstractedComponent(
        'NOR', Component.types.NOR, specs['NOR'], specs,
        'nor2', 300, 200, 80, 60, '#0099FF'
      );
      
      component.inputs['S'] = new Input('S', 'Set', 0);
      component.inputs['R'] = new Input('R', 'Reset', 0);
      component.outputs['Q'] = new Output('Q', 'Q', 0);
      component.outputs['Qn'] = new Output('Qn', 'Q\'', 0);
      
      conn = new Connection(component.inputs['S'], component.items['nor1'].outputs[0], []);
      component.connections.push(conn);
      component.addConnectionToIndex(conn);
      
      conn = new Connection(component.inputs['R'], component.items['nor2'].outputs[0], []);
      component.connections.push(conn);
      component.addConnectionToIndex(conn);
      
      conn = new Connection(component.items['nor1'].inputs[0], component.items['nor2'].outputs[1], []);
      component.connections.push(conn);
      component.addConnectionToIndex(conn);
      
      conn = new Connection(component.items['nor2'].inputs[0], component.items['nor1'].outputs[1], []);
      component.connections.push(conn);
      component.addConnectionToIndex(conn);
      
      conn = new Connection(component.items['nor1'].inputs[0], component.outputs['Q'], []);
      component.connections.push(conn);
      component.addConnectionToIndex(conn);
      
      conn = new Connection(component.items['nor2'].inputs[0], component.outputs['Qn'], []);
      component.connections.push(conn);
      component.addConnectionToIndex(conn);
      
      expect(component.connections.length).toBe(6);
      expect(component.items['nor1'].spec.connectionsByInput).toBeInstanceOf(Map);
    });
    
    test('should save SR latch as spec', () => {
      // Setup NOR first
      const norComp = new Component('test-canvas', Logger.logLvl.ERROR);
      norComp.items['or1'] = new Or('or1', 0, 0);
      norComp.items['not1'] = new Not('not1', 0, 0);
      norComp.inputs['A'] = new Input('A', 'A', 0);
      norComp.inputs['B'] = new Input('B', 'B', 0);
      norComp.outputs['Q'] = new Output('Q', 'Q', 0);
      norComp.connections = [];
      
      let conn = new Connection(norComp.inputs['A'], norComp.items['or1'].outputs[0], []);
      norComp.connections.push(conn);
      norComp.addConnectionToIndex(conn);
      conn = new Connection(norComp.inputs['B'], norComp.items['or1'].outputs[1], []);
      norComp.connections.push(conn);
      norComp.addConnectionToIndex(conn);
      conn = new Connection(norComp.items['or1'].inputs[0], norComp.items['not1'].outputs[0], []);
      norComp.connections.push(conn);
      norComp.addConnectionToIndex(conn);
      conn = new Connection(norComp.items['not1'].inputs[0], norComp.outputs['Q'], []);
      norComp.connections.push(conn);
      norComp.addConnectionToIndex(conn);
      
      const norSpec = new AbstractedComponentSpec(norComp, 'NOR');
      norSpec.rebuildConnectionIndex();
      specs['NOR'] = norSpec;
      
      // Create SR latch
      component.items = {};
      component.inputs = {};
      component.outputs = {};
      component.connections = [];
      component.connectionsByInput.clear();
      
      component.items['nor1'] = new AbstractedComponent('NOR', Component.types.NOR, specs['NOR'], specs, 'nor1', 200, 200, 80, 60, '#0099FF');
      component.items['nor2'] = new AbstractedComponent('NOR', Component.types.NOR, specs['NOR'], specs, 'nor2', 300, 200, 80, 60, '#0099FF');
      component.inputs['S'] = new Input('S', 'Set', 0);
      component.inputs['R'] = new Input('R', 'Reset', 0);
      component.outputs['Q'] = new Output('Q', 'Q', 0);
      component.outputs['Qn'] = new Output('Qn', 'Q\'', 0);
      
      conn = new Connection(component.inputs['S'], component.items['nor1'].outputs[0], []);
      component.connections.push(conn);
      component.addConnectionToIndex(conn);
      conn = new Connection(component.inputs['R'], component.items['nor2'].outputs[0], []);
      component.connections.push(conn);
      component.addConnectionToIndex(conn);
      conn = new Connection(component.items['nor1'].inputs[0], component.items['nor2'].outputs[1], []);
      component.connections.push(conn);
      component.addConnectionToIndex(conn);
      conn = new Connection(component.items['nor2'].inputs[0], component.items['nor1'].outputs[1], []);
      component.connections.push(conn);
      component.addConnectionToIndex(conn);
      conn = new Connection(component.items['nor1'].inputs[0], component.outputs['Q'], []);
      component.connections.push(conn);
      component.addConnectionToIndex(conn);
      conn = new Connection(component.items['nor2'].inputs[0], component.outputs['Qn'], []);
      component.connections.push(conn);
      component.addConnectionToIndex(conn);
      
      const srSpec = new AbstractedComponentSpec(component, 'SR_LATCH');
      srSpec.rebuildConnectionIndex();
      
      expect(srSpec.name).toBe('SR_LATCH');
      expect(srSpec.connectionsByInput).toBeInstanceOf(Map);
    });
  });

  describe('Step 3: Flip-flop from SR Latch', () => {
    test('should create flip-flop with enable', () => {
      // This test just verifies structure, not full logic
      component.items['and1'] = new And('and1', 100, 150);
      component.items['sr1'] = new And('sr1', 250, 200); // Using AND as placeholder
      component.inputs['D'] = new Input('D', 'Data', 0);
      component.inputs['E'] = new Input('E', 'Enable', 0);
      component.outputs['Q'] = new Output('Q', 'Q', 0);
      
      let conn = new Connection(component.inputs['E'], component.items['and1'].outputs[0], []);
      component.connections.push(conn);
      component.addConnectionToIndex(conn);
      
      conn = new Connection(component.inputs['D'], component.items['and1'].outputs[1], []);
      component.connections.push(conn);
      component.addConnectionToIndex(conn);
      
      conn = new Connection(component.items['and1'].inputs[0], component.items['sr1'].outputs[0], []);
      component.connections.push(conn);
      component.addConnectionToIndex(conn);
      
      conn = new Connection(component.items['sr1'].inputs[0], component.outputs['Q'], []);
      component.connections.push(conn);
      component.addConnectionToIndex(conn);
      
      expect(component.connections.length).toBe(4);
      
      const ffSpec = new AbstractedComponentSpec(component, 'FLIP_FLOP');
      ffSpec.rebuildConnectionIndex();
      
      expect(ffSpec.name).toBe('FLIP_FLOP');
      expect(ffSpec.connectionsByInput).toBeInstanceOf(Map);
    });
  });
});
