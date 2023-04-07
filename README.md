# Fun with Logic Gates

Use AND, OR, and NOT logic gates to create logic circuits. These gates are fundamental 
building blocks of digital circuits, and they are used to perform logical operations 
on binary inputs (inputs that can take on the value of either 0 or 1).

An AND gate takes two inputs and produces an output that is 1 if and only if both 
inputs are 1. In other words, the output is 1 if and only if both inputs are true.

An OR gate also takes two inputs and produces an output that is 1 if either input 
is 1. In other words, the output is 1 if at least one of the inputs is true.

A NOT gate takes a single input and produces an output that is the opposite of the 
input. If the input is 1, the output is 0; if the input is 0, the output is 1.

Using these gates, you can create more complex circuits by combining them in different 
ways. For example, you can use an AND gate followed by a NOT gate to create a NAND gate, 
which produces an output that is the opposite of what an AND gate would produce. You 
can also combine multiple gates to create more complex circuits, such as a binary adder.

Once you have created a circuit, you can save it as a component and use it as a building 
block for even bigger circuits. This can save time and effort when designing complex 
circuits, as you can reuse circuits that you have already created rather than starting 
from scratch every time.

## Controls

- Use the buttons below the work area to create new inputs, outputs, and gates. 
- Right-click on items in the work area to reveal a context menu.
- Shift+Left-click on inputs or outputs to start a connection
  - Left-click on an input or output to establish the connection
  - An output may only be connected to one input, but each input may be connected to multiple outputs
- Once connections are complete, click on the "Truth Table" button to generate a table showing how all combinations of inputs affect the output(s)

## Usage

```html
<script src="fun.js"></script>
<!-- ... -->
<canvas id="canvas" width="1000" height="600"></canvas>
<script type="application/javascript">
    new FunWithLogicGates("canvas", Logger.logLvl.INFO) ;
</script>
```