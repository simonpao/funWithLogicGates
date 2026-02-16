/**
 * Performance test for truth table generation
 * Tests various input sizes to determine appropriate warning threshold
 */

const { createMockCanvas, cleanupCanvas } = require('../helpers/testHelpers');

describe('Truth Table Performance Tests', () => {
    let component;
    let canvas;

    beforeEach(() => {
        canvas = createMockCanvas('test-canvas', 800, 600);
        component = new Component('test-canvas', Logger.logLvl.ERROR);
    });

    afterEach(() => {
        if (component && component.removeEventListeners) {
            component.removeEventListeners();
        }
        cleanupCanvas(canvas);
    });

    /**
     * Create a circuit with N inputs and 1 output (simple AND gate behavior)
     */
    function createCircuitWithInputs(comp, numInputs) {
        // Create inputs
        for (let i = 0; i < numInputs; i++) {
            const input = new Input(
                `input_${i}`,
                `In${i}`,
                0
            );
            comp.inputs[input.id] = input;
        }

        // Create one output
        const output = new Output(
            'output_0',
            'Out',
            0
        );
        comp.outputs[output.id] = output;

        // Create a simple AND-like logic: output is 1 if all inputs are 1
        // We'll do this by creating a chain of AND gates
        if (numInputs === 1) {
            // Single input - just connect directly (buffer behavior)
            const item = new Item(10, 10, 50, 50, Component.types.BUF, '#888');
            item.id = 'buf_0';
            item.inputs.push(new Input(`buf_0_in_0`, 'A', 0));
            item.outputs.push(new Output(`buf_0_out_0`, 'Y', 0));
            comp.items[item.id] = item;
            comp.indices.items[item.id] = item.id;
            
            // Connect circuit input to gate input
            const conn1 = new Connection(
                comp.inputs['input_0'],
                item.inputs[0]
            );
            comp.connections[conn1.id] = conn1;
            
            // Connect gate output to circuit output
            const conn2 = new Connection(
                item.outputs[0],
                comp.outputs['output_0']
            );
            comp.connections[conn2.id] = conn2;
        } else {
            // Multiple inputs - create AND gates in a tree
            const items = [];
            let xPos = 10;
            
            // Create enough AND gates to handle all inputs
            const numGates = numInputs - 1;
            for (let i = 0; i < numGates; i++) {
                const item = new Item(xPos, 10 + (i * 60), 50, 50, Component.types.AND, '#888');
                item.id = `and_${i}`;
                item.inputs.push(new Input(`and_${i}_in_0`, 'A', 0));
                item.inputs.push(new Input(`and_${i}_in_1`, 'B', 0));
                item.outputs.push(new Output(`and_${i}_out_0`, 'Y', 0));
                comp.items[item.id] = item;
                comp.indices.items[item.id] = item.id;
                items.push(item);
                xPos += 60;
            }

            // Connect first gate to first two inputs
            const conn1 = new Connection(comp.inputs['input_0'], items[0].inputs[0]);
            comp.connections[conn1.id] = conn1;
            const conn2 = new Connection(comp.inputs['input_1'], items[0].inputs[1]);
            comp.connections[conn2.id] = conn2;

            // Chain remaining inputs through AND gates
            for (let i = 1; i < numGates; i++) {
                // Connect previous gate output to this gate's first input
                const connPrev = new Connection(items[i-1].outputs[0], items[i].inputs[0]);
                comp.connections[connPrev.id] = connPrev;
                
                // Connect next circuit input to this gate's second input
                const connIn = new Connection(comp.inputs[`input_${i+1}`], items[i].inputs[1]);
                comp.connections[connIn.id] = connIn;
            }

            // Connect final gate output to circuit output
            const connOut = new Connection(
                items[numGates - 1].outputs[0],
                comp.outputs['output_0']
            );
            comp.connections[connOut.id] = connOut;
        }
    }

    /**
     * Measure execution time of truth table computation
     */
    async function measureTruthTableTime(comp) {
        const inIds = Object.keys(comp.inputs);
        const numIn = inIds.length;
        const outIds = Object.keys(comp.outputs);
        const numOut = outIds.length;
        const combinations = Math.pow(2, numIn);

        const startTime = performance.now();
        await comp.computeTruthTable(inIds, numIn, outIds, numOut, combinations);
        const endTime = performance.now();

        return endTime - startTime;
    }

    // Performance tests for different input counts
    const testCases = [
        { inputs: 4, expectedMax: 50 },    // 16 combinations - should be fast
        { inputs: 6, expectedMax: 100 },   // 64 combinations - should be fast
        { inputs: 8, expectedMax: 300 },   // 256 combinations - current threshold
        { inputs: 10, expectedMax: 1000 }, // 1024 combinations - testing above current
        { inputs: 12, expectedMax: 4000 }, // 4096 combinations - testing well above
        //{ inputs: 14, expectedMax: 16000 }, // 16384 combinations - getting large
    ];

    testCases.forEach(({ inputs, expectedMax }) => {
        test(`Performance with ${inputs} inputs (${Math.pow(2, inputs)} combinations)`, async () => {
            createCircuitWithInputs(component, inputs);
            
            const duration = await measureTruthTableTime(component);
            
            //console.log(`${inputs} inputs: ${duration.toFixed(2)}ms (${Math.pow(2, inputs)} combinations)`);
            
            // Verify it completes in reasonable time
            expect(duration).toBeLessThan(expectedMax);
        }, 30000); // 30 second timeout for large tests
    });

    // Comprehensive benchmark test
    /*test('Benchmark suite - determine optimal threshold', async () => {
        const results = [];
        
        for (let numInputs = 4; numInputs <= 14; numInputs++) {
            // Clean up previous test
            component.items = {};
            component.inputs = {};
            component.outputs = {};
            component.connections = {};
            component.indices.items = {};
            
            createCircuitWithInputs(component, numInputs);
            
            // Run test 3 times and take median
            const times = [];
            for (let run = 0; run < 3; run++) {
                const duration = await measureTruthTableTime(component);
                times.push(duration);
            }
            
            times.sort((a, b) => a - b);
            const medianTime = times[1];
            const combinations = Math.pow(2, numInputs);
            
            results.push({
                inputs: numInputs,
                combinations,
                medianTimeMs: medianTime,
                timePer1000: (medianTime / combinations) * 1000
            });
        }
        
        // Print comprehensive report
        console.log('\n=== TRUTH TABLE PERFORMANCE BENCHMARK ===');
        console.log('Inputs | Combinations | Median Time | Time/1000 rows');
        console.log('-------|--------------|-------------|---------------');
        results.forEach(r => {
            console.log(
                `  ${r.inputs.toString().padStart(2)}   | ` +
                `${r.combinations.toString().padStart(12)} | ` +
                `${r.medianTimeMs.toFixed(2).padStart(10)}ms | ` +
                `${r.timePer1000.toFixed(2).padStart(10)}ms`
            );
        });
        
        // Determine recommendation based on results
        // Threshold should be where computation takes more than 1 second
        const threshold = results.find(r => r.medianTimeMs > 1000);
        const recommendedThreshold = threshold ? threshold.inputs - 1 : 14;
        
        console.log('\n=== RECOMMENDATION ===');
        console.log(`Current threshold: 8 inputs (${Math.pow(2, 8)} combinations)`);
        console.log(`Recommended threshold: ${recommendedThreshold} inputs (${Math.pow(2, recommendedThreshold)} combinations)`);
        console.log(`Reason: Operations above this take more than 1 second`);
        
        // The test passes - this is informational
        expect(results.length).toBeGreaterThan(0);
    }, 60000); // 60 second timeout for full benchmark*/
});
