class Drawer {
    static dim = {
        io: {
            x: 65,
            r: 10,
            b: 80
        }
    }
    backgroundColor = "white" ;

    constructor(canvas2dCtx, w, h, logLvl = Logger.logLvl.INFO) {
        this.logger = new Logger(logLvl, "Drawer") ;

        this.canvas2dCtx = canvas2dCtx ;
        this.canvasWidth = w ;
        this.canvasHeight = h ;
        this.clearCanvas() ;
    }

    clearCanvas() {
        // Whiteout whole canvas
        this.canvas2dCtx.fillStyle = this.backgroundColor;
        this.canvas2dCtx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Inputs Boundary
        this.canvas2dCtx.strokeStyle = "black" ;
        this.canvas2dCtx.lineWidth = "1" ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(Drawer.dim.io.b, 0) ;
        this.canvas2dCtx.lineTo(Drawer.dim.io.b, this.canvasHeight) ;
        this.canvas2dCtx.stroke() ;

        // Outputs Boundary
        this.canvas2dCtx.strokeStyle = "black" ;
        this.canvas2dCtx.lineWidth = "1" ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(this.canvasWidth-Drawer.dim.io.b, 0) ;
        this.canvas2dCtx.lineTo(this.canvasWidth-Drawer.dim.io.b, this.canvasHeight) ;
        this.canvas2dCtx.stroke() ;
    }

    fillRectangle(x, y, w, h, color, label = "") {
        this.canvas2dCtx.fillStyle = color;
        this.canvas2dCtx.fillRect(x, y, w, h);

        if(label !== "") {
            this.canvas2dCtx.font = "16px Monospace";
            this.canvas2dCtx.fillStyle = "white";
            this.canvas2dCtx.fillText(label, x+15, y+31);
        }
    }

    fillAnd(x, y, w, h, color) {
        // Main shape
        this.canvas2dCtx.fillStyle = color;
        this.canvas2dCtx.beginPath() ;
        this.canvas2dCtx.moveTo(x+10,y) ;
        this.canvas2dCtx.lineTo(x+10,y+h) ;
        this.canvas2dCtx.lineTo(x-10+(w/2),y+h) ;
        this.canvas2dCtx.bezierCurveTo(x-15+(w*1.25), y+(h), x-15+(w*1.25), y, x-10+(w/2), y) ;
        this.canvas2dCtx.fill();

        // Input 1
        this.canvas2dCtx.strokeStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(x, y+(h/4)) ;
        this.canvas2dCtx.lineTo(x+10, y+(h/4)) ;
        this.canvas2dCtx.stroke() ;

        // Input 2
        this.canvas2dCtx.strokeStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath() ;
        this.canvas2dCtx.moveTo(x, (y+h)-(h/4)) ;
        this.canvas2dCtx.lineTo(x+10, (y+h)-(h/4)) ;
        this.canvas2dCtx.stroke() ;

        // Output 1
        this.canvas2dCtx.strokeStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath() ;
        this.canvas2dCtx.moveTo(x+w, y+(h/2)) ;
        this.canvas2dCtx.lineTo((x+w)-10, y+(h/2)) ;
        this.canvas2dCtx.stroke() ;

        // Label
        this.canvas2dCtx.font = "16px Monospace";
        this.canvas2dCtx.fillStyle = "white";
        this.canvas2dCtx.fillText("AND", x+20, y+30);
    }

    fillNand(x, y, w, h, color) {
        // Main shape
        this.canvas2dCtx.fillStyle = color;
        this.canvas2dCtx.beginPath() ;
        this.canvas2dCtx.moveTo(x+10,y) ;
        this.canvas2dCtx.lineTo(x+10,y+h) ;
        this.canvas2dCtx.lineTo(x-25+(w/2),y+h) ;
        this.canvas2dCtx.bezierCurveTo(x-25+(w*1.25), y+h, x-20+(w*1.25), y, x-25+(w/2), y) ;
        this.canvas2dCtx.fill();

        // Bubble
        this.canvas2dCtx.beginPath() ;
        this.canvas2dCtx.arc((x+w)-15, (y)+(h/2), 7, 0, Math.PI * 2, false) ;
        this.canvas2dCtx.fill();

        // Input 1
        this.canvas2dCtx.strokeStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(x, y+(h/4)) ;
        this.canvas2dCtx.lineTo(x+10, y+(h/4)) ;
        this.canvas2dCtx.stroke() ;

        // Input 2
        this.canvas2dCtx.strokeStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath() ;
        this.canvas2dCtx.moveTo(x, (y+h)-(h/4)) ;
        this.canvas2dCtx.lineTo(x+10, (y+h)-(h/4)) ;
        this.canvas2dCtx.stroke() ;

        // Output 1
        this.canvas2dCtx.strokeStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath() ;
        this.canvas2dCtx.moveTo(x+w, y+(h/2)) ;
        this.canvas2dCtx.lineTo((x+w)-10, y+(h/2)) ;
        this.canvas2dCtx.stroke() ;

        // Label
        this.canvas2dCtx.font = "16px Monospace";
        this.canvas2dCtx.fillStyle = "white";
        this.canvas2dCtx.fillText("NAND", x+15, y+30);
    }

    fillOr(x, y, w, h, color) {
        // Main shape
        this.canvas2dCtx.fillStyle = color;
        this.canvas2dCtx.beginPath() ;
        this.canvas2dCtx.moveTo(x+10,y) ;
        this.canvas2dCtx.bezierCurveTo(x+(w/3), y+10, x+(w/3), y+h-10, x+10, y+h) ;
        this.canvas2dCtx.lineTo(x-10+(w/2),y+h) ;
        this.canvas2dCtx.bezierCurveTo(x-15+(w*1.25), y+(h), x-15+(w*1.25), y, x-10+(w/2), y) ;
        this.canvas2dCtx.fill();

        // Input 1
        this.canvas2dCtx.strokeStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(x+10, y+(h/4)) ;
        this.canvas2dCtx.lineTo(x+20, y+(h/4)) ;
        this.canvas2dCtx.stroke() ;

        // Input 2
        this.canvas2dCtx.strokeStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(x+10, (y+h)-(h/4)) ;
        this.canvas2dCtx.lineTo(x+20, (y+h)-(h/4)) ;
        this.canvas2dCtx.stroke() ;

        // Output 1
        this.canvas2dCtx.strokeStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath() ;
        this.canvas2dCtx.moveTo(x+w, y+(h/2)) ;
        this.canvas2dCtx.lineTo((x+w)-10, y+(h/2)) ;
        this.canvas2dCtx.stroke() ;

        // Label
        this.canvas2dCtx.font = "16px Monospace";
        this.canvas2dCtx.fillStyle = "white";
        this.canvas2dCtx.fillText("OR", x+30, y+30);
    }

    fillNor(x, y, w, h, color) {
        // Main shape
        this.canvas2dCtx.fillStyle = color;
        this.canvas2dCtx.beginPath() ;
        this.canvas2dCtx.moveTo(x,y) ;
        this.canvas2dCtx.bezierCurveTo(x+(w/3)-10, y+10, x+(w/3)-10, y+h-10, x, y+h) ;
        this.canvas2dCtx.lineTo(x-25+(w/2),y+h) ;
        this.canvas2dCtx.bezierCurveTo(x-25+(w*1.25), y+h, x-20+(w*1.25), y, x-25+(w/2), y) ;
        this.canvas2dCtx.fill();

        // Bubble
        this.canvas2dCtx.beginPath() ;
        this.canvas2dCtx.arc((x+w)-15, (y)+(h/2), 7, 0, Math.PI * 2, false) ;
        this.canvas2dCtx.fill();

        // Input 1
        this.canvas2dCtx.strokeStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(x-2, y+(h/4)) ;
        this.canvas2dCtx.lineTo(x+10, y+(h/4)) ;
        this.canvas2dCtx.stroke() ;

        // Input 2
        this.canvas2dCtx.strokeStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(x-2, (y+h)-(h/4)) ;
        this.canvas2dCtx.lineTo(x+10, (y+h)-(h/4)) ;
        this.canvas2dCtx.stroke() ;

        // Output 1
        this.canvas2dCtx.strokeStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath() ;
        this.canvas2dCtx.moveTo(x+w, y+(h/2)) ;
        this.canvas2dCtx.lineTo((x+w)-10, y+(h/2)) ;
        this.canvas2dCtx.stroke() ;

        // Label
        this.canvas2dCtx.font = "16px Monospace";
        this.canvas2dCtx.fillStyle = "white";
        this.canvas2dCtx.fillText("NOR", x+20, y+30);
    }

    fillBuffer(x, y, w, h, color) {
        // Main shape
        this.canvas2dCtx.fillStyle = color;
        this.canvas2dCtx.beginPath() ;
        this.canvas2dCtx.moveTo(x+10,y) ;
        this.canvas2dCtx.lineTo(x+w-10,(y-3)+(h/2)) ;
        this.canvas2dCtx.lineTo(x+w-10,(y+3)+(h/2)) ;
        this.canvas2dCtx.lineTo(x+10,y+h) ;
        this.canvas2dCtx.fill();

        // Input 1
        this.canvas2dCtx.strokeStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(x, y+(h/2)) ;
        this.canvas2dCtx.lineTo(x+10, y+(h/2)) ;
        this.canvas2dCtx.stroke() ;

        // Output 1
        this.canvas2dCtx.strokeStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(x+w, y+(h/2)) ;
        this.canvas2dCtx.lineTo((x+w)-10, y+(h/2)) ;
        this.canvas2dCtx.stroke() ;

        // Label
        this.canvas2dCtx.font = "16px Monospace";
        this.canvas2dCtx.fillStyle = "white";
        this.canvas2dCtx.fillText("BUF", x+20, y+30);
    }

    fillXor(x, y, w, h, color) {
        // Main shape
        this.canvas2dCtx.fillStyle = color;
        this.canvas2dCtx.beginPath() ;
        this.canvas2dCtx.moveTo(x+10,y) ;
        this.canvas2dCtx.bezierCurveTo(x+(w/3), y+10, x+(w/3), y+h-10, x+10, y+h) ;
        this.canvas2dCtx.lineTo(x-10+(w/2),y+h) ;
        this.canvas2dCtx.bezierCurveTo(x-15+(w*1.25), y+(h), x-15+(w*1.25), y, x-10+(w/2), y) ;
        this.canvas2dCtx.fill();

        // Input 1
        this.canvas2dCtx.strokeStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(x, y+(h/4)) ;
        this.canvas2dCtx.lineTo(x+20, y+(h/4)) ;
        this.canvas2dCtx.stroke() ;

        // Input 2
        this.canvas2dCtx.strokeStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(x, (y+h)-(h/4)) ;
        this.canvas2dCtx.lineTo(x+20, (y+h)-(h/4)) ;
        this.canvas2dCtx.stroke() ;

        // Curve
        this.canvas2dCtx.strokeStyle = color ;
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(x+3,y+1) ;
        this.canvas2dCtx.bezierCurveTo(x+(w/3)-7, y+10, x+(w/3)-7, y+h-10, x+3, y+h-1) ;
        this.canvas2dCtx.stroke() ;

        // Output 1
        this.canvas2dCtx.strokeStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath() ;
        this.canvas2dCtx.moveTo(x+w, y+(h/2)) ;
        this.canvas2dCtx.lineTo((x+w)-10, y+(h/2)) ;
        this.canvas2dCtx.stroke() ;

        // Label
        this.canvas2dCtx.font = "16px Monospace";
        this.canvas2dCtx.fillStyle = "white";
        this.canvas2dCtx.fillText("XOR", x+28, y+30);
    }

    fillXnor(x, y, w, h, color) {
        // Main shape
        this.canvas2dCtx.fillStyle = color;
        this.canvas2dCtx.beginPath() ;
        this.canvas2dCtx.moveTo(x+10,y) ;
        this.canvas2dCtx.bezierCurveTo(x+(w/3)-5, y+10, x+(w/3)-5, y+h-10, x+10, y+h) ;
        this.canvas2dCtx.lineTo(x-25+(w/2),y+h) ;
        this.canvas2dCtx.bezierCurveTo(x-25+(w*1.25), y+h, x-20+(w*1.25), y, x-25+(w/2), y) ;
        this.canvas2dCtx.fill();

        // Bubble
        this.canvas2dCtx.beginPath() ;
        this.canvas2dCtx.arc((x+w)-15, (y)+(h/2), 7, 0, Math.PI * 2, false) ;
        this.canvas2dCtx.fill();

        // Input 1
        this.canvas2dCtx.strokeStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(x-2, y+(h/4)) ;
        this.canvas2dCtx.lineTo(x+17, y+(h/4)) ;
        this.canvas2dCtx.stroke() ;

        // Input 2
        this.canvas2dCtx.strokeStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(x-2, (y+h)-(h/4)) ;
        this.canvas2dCtx.lineTo(x+17, (y+h)-(h/4)) ;
        this.canvas2dCtx.stroke() ;

        // Curve
        this.canvas2dCtx.strokeStyle = color ;
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(x,y+1) ;
        this.canvas2dCtx.bezierCurveTo(x+(w/3)-10, y+10, x+(w/3)-10, y+h-10, x, y+h-1) ;
        this.canvas2dCtx.stroke() ;

        // Output 1
        this.canvas2dCtx.strokeStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath() ;
        this.canvas2dCtx.moveTo(x+w, y+(h/2)) ;
        this.canvas2dCtx.lineTo((x+w)-10, y+(h/2)) ;
        this.canvas2dCtx.stroke() ;

        // Label
        this.canvas2dCtx.font = "16px Monospace";
        this.canvas2dCtx.fillStyle = "white";
        this.canvas2dCtx.fillText("XNOR", x+18, y+30);
    }

    fillNot(x, y, w, h, color) {
        // Main shape
        this.canvas2dCtx.fillStyle = color;
        this.canvas2dCtx.beginPath() ;
        this.canvas2dCtx.moveTo(x+10,y) ;
        this.canvas2dCtx.lineTo(x+(w/1.25),(y-3)+(h/2)) ;
        this.canvas2dCtx.lineTo(x+(w/1.25),(y+3)+(h/2)) ;
        this.canvas2dCtx.lineTo(x+10,y+h) ;
        this.canvas2dCtx.fill();

        // Bubble
        this.canvas2dCtx.beginPath() ;
        this.canvas2dCtx.arc((x+w)-15, (y)+(h/2), 7, 0, Math.PI * 2, false) ;
        this.canvas2dCtx.fill();

        // Input 1
        this.canvas2dCtx.strokeStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(x, y+(h/2)) ;
        this.canvas2dCtx.lineTo(x+10, y+(h/2)) ;
        this.canvas2dCtx.stroke() ;

        // Output 1
        this.canvas2dCtx.strokeStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(x+w, y+(h/2)) ;
        this.canvas2dCtx.lineTo((x+w)-10, y+(h/2)) ;
        this.canvas2dCtx.stroke() ;

        // Label
        this.canvas2dCtx.font = "16px Monospace";
        this.canvas2dCtx.fillStyle = "white";
        this.canvas2dCtx.fillText("NOT", x+13, y+30);
    }

    fillCustom(name, componentSpec, x, y, w, h, color) {
        this.canvas2dCtx.fillStyle = color;
        this.canvas2dCtx.fillRect(x+10, y, w-20, h);

        // Inputs
        let ids = Object.keys( componentSpec.inputs ) ;
        let marginY = h/(componentSpec.numberOfInputs+1) ;
        for(let i = 0; i < componentSpec.numberOfInputs; i++) {
            let posY = y+(marginY*(i+1))+5 ;
            this.canvas2dCtx.strokeStyle = "black";
            this.canvas2dCtx.lineWidth = "5" ;
            this.canvas2dCtx.beginPath();
            this.canvas2dCtx.moveTo(x, posY) ;
            this.canvas2dCtx.lineTo(x+10, posY) ;
            this.canvas2dCtx.stroke() ;

            let label = componentSpec.inputs[ids[i]].label ;
            this.canvas2dCtx.font = "14px Monospace";
            this.canvas2dCtx.fillStyle = "white";
            this.canvas2dCtx.fillText(label, x+15, posY+5);
        }

        // Outputs
        ids = Object.keys( componentSpec.outputs ) ;
        marginY = h/(componentSpec.numberOfOutputs+1) ;
        for(let i = 0; i < componentSpec.numberOfOutputs; i++) {
            let posY = y+(marginY*(i+1))+5 ;
            this.canvas2dCtx.strokeStyle = "black";
            this.canvas2dCtx.lineWidth = "5";
            this.canvas2dCtx.beginPath();
            this.canvas2dCtx.moveTo(x + w, posY);
            this.canvas2dCtx.lineTo((x + w) - 10, posY);
            this.canvas2dCtx.stroke();

            let label = componentSpec.outputs[ids[i]].label ;
            this.canvas2dCtx.font = "14px Monospace";
            this.canvas2dCtx.fillStyle = "white";
            this.canvas2dCtx.fillText(label, (x+w)-(label.length*8)-14, posY+5);
        }

        this.canvas2dCtx.font = "14px Monospace";
        this.canvas2dCtx.fillStyle = "white";
        this.canvas2dCtx.fillText(name, (x+w/2)-(name.length*4), y+15);
    }

    fillRectangularComponent(name, numIn, inLabels, numOut, outLabels, x, y, w, h, color) {
        this.canvas2dCtx.fillStyle = color;
        this.canvas2dCtx.fillRect(x+10, y, w-20, h);

        // Inputs
        let marginY = h/(numIn+1) ;
        for(let i = 0; i < numIn; i++) {
            let posY = y+(marginY*(i+1))+5 ;
            this.canvas2dCtx.strokeStyle = "black";
            this.canvas2dCtx.lineWidth = "5" ;
            this.canvas2dCtx.beginPath();
            this.canvas2dCtx.moveTo(x, posY) ;
            this.canvas2dCtx.lineTo(x+10, posY) ;
            this.canvas2dCtx.stroke() ;

            this.canvas2dCtx.font = "14px Monospace";
            this.canvas2dCtx.fillStyle = "white";
            this.canvas2dCtx.fillText(inLabels[i], x+15, posY+5);
        }

        // Outputs
        marginY = h/(numOut+1) ;
        for(let i = 0; i < numOut; i++) {
            let posY = y+(marginY*(i+1))+5 ;
            this.canvas2dCtx.strokeStyle = "black";
            this.canvas2dCtx.lineWidth = "5";
            this.canvas2dCtx.beginPath();
            this.canvas2dCtx.moveTo(x + w, posY);
            this.canvas2dCtx.lineTo((x + w) - 10, posY);
            this.canvas2dCtx.stroke();

            this.canvas2dCtx.font = "14px Monospace";
            this.canvas2dCtx.fillStyle = "white";
            this.canvas2dCtx.fillText(outLabels[i], (x+w)-(outLabels[i].length*8)-14, posY+5);
        }

        this.canvas2dCtx.font = "14px Monospace";
        this.canvas2dCtx.fillStyle = "white";
        this.canvas2dCtx.fillText(name, (x+w/2)-(name.length*4), y+15);
    }

    fillSevenSegment(x, y, state) {
        const w = 100, h = 110, s = 7 ;
        const black = "#333333", red = "#ff1111", gray = "#aeaeae" ;

        this.canvas2dCtx.fillStyle = black;
        this.canvas2dCtx.fillRect(x+10, y, w-10, h);

        // Top bar A
        this.canvas2dCtx.strokeStyle = state[0] ? red : gray;
        this.canvas2dCtx.lineWidth = s ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(x+40, y+10) ;
        this.canvas2dCtx.lineTo(x+w-10, y+10) ;
        this.canvas2dCtx.stroke() ;

        // Top right line B
        this.canvas2dCtx.strokeStyle = state[1] ? red : gray;
        this.canvas2dCtx.lineWidth = s ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(x+w-10, y+15) ;
        this.canvas2dCtx.lineTo(x+w-15, y+(h/2)-5) ;
        this.canvas2dCtx.stroke() ;

        // Bottom right line C
        this.canvas2dCtx.strokeStyle = state[2] ? red : gray;
        this.canvas2dCtx.lineWidth = s ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(x+w-15, y+(h/2)+5) ;
        this.canvas2dCtx.lineTo(x+w-20, y+h-15) ;
        this.canvas2dCtx.stroke() ;

        // Bottom bar D
        this.canvas2dCtx.strokeStyle = state[3] ? red : gray;
        this.canvas2dCtx.lineWidth = s ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(x+30, y+h-10) ;
        this.canvas2dCtx.lineTo(x+w-20, y+h-10) ;
        this.canvas2dCtx.stroke() ;

        // Bottom left line E
        this.canvas2dCtx.strokeStyle = state[4] ? red : gray;
        this.canvas2dCtx.lineWidth = s ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(x+35, y+(h/2)+5) ;
        this.canvas2dCtx.lineTo(x+30, y+h-15) ;
        this.canvas2dCtx.stroke() ;

        // Top left line F
        this.canvas2dCtx.strokeStyle = state[5] ? red : gray;
        this.canvas2dCtx.lineWidth = s ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(x+40, y+15) ;
        this.canvas2dCtx.lineTo(x+35, y+(h/2)-5) ;
        this.canvas2dCtx.stroke() ;

        // Middle bar G
        this.canvas2dCtx.strokeStyle = state[6] ? red : gray;
        this.canvas2dCtx.lineWidth = s ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(x+35, y+(h/2)) ;
        this.canvas2dCtx.lineTo(x+w-15, y+(h/2)) ;
        this.canvas2dCtx.stroke() ;

        // Decimal Point DP
        this.canvas2dCtx.fillStyle = state[7] ? red : gray;
        this.canvas2dCtx.beginPath() ;
        this.canvas2dCtx.arc((x+w)-10, y+h-10, 5, 0, Math.PI * 2, false) ;
        this.canvas2dCtx.fill();

        // Inputs
        let ids = ["DP", "A", "B", "C", "D", "E", "F", "G"] ;
        let marginY = h/(ids.length+1) ;
        for(let i = 0; i < ids.length; i++) {
            let posY = y+(marginY*(i+1)) ;
            this.canvas2dCtx.strokeStyle = black;
            this.canvas2dCtx.lineWidth = 5 ;
            this.canvas2dCtx.beginPath();
            this.canvas2dCtx.moveTo(x, posY) ;
            this.canvas2dCtx.lineTo(x+10, posY) ;
            this.canvas2dCtx.stroke() ;

            let label = ids[i] ;
            this.canvas2dCtx.font = "14px Monospace";
            this.canvas2dCtx.fillStyle = "white";
            this.canvas2dCtx.fillText(label, x+13, posY+3);
        }

    }

    fillInputs(inputs) {
        let number = Object.keys(inputs).length ;
        this.clearInputs() ;
        //this.logger.debug(`${number} input`) ;

        let spacer = this.canvasHeight / (number+1) ;
        let c = 1 ;
        for(let i in inputs) {
            // Circle
            this.canvas2dCtx.fillStyle = inputs[i].state === 0 ? "black" : "red";
            this.canvas2dCtx.beginPath() ;
            this.canvas2dCtx.arc(Drawer.dim.io.x, (spacer*c), Drawer.dim.io.r, 0, Math.PI * 2, false) ;
            this.canvas2dCtx.fill();

            // Label
            this.canvas2dCtx.font = "12px Monospace";
            this.canvas2dCtx.fillStyle = "black";
            this.canvas2dCtx.fillText(inputs[i].label, 5, (spacer*c)+5);

            inputs[i].x = 65 ;
            inputs[i].y = spacer*c ;
            c++ ;
        }
    }

    test(x, y, color) {
        this.canvas2dCtx.fillStyle = color ?? "red";
        this.canvas2dCtx.beginPath() ;
        this.canvas2dCtx.arc(x, y, 5, 0, Math.PI * 2, false) ;
        this.canvas2dCtx.fill();
    }

    clearInputs() {
        this.canvas2dCtx.fillStyle = this.backgroundColor;
        this.canvas2dCtx.fillRect(0, 0, Drawer.dim.io.b-2, this.canvasHeight);
    }

    fillOutputs(outputs) {
        let number = Object.keys(outputs).length ;
        this.clearOutputs() ;
        //this.logger.debug(`${number} output`) ;

        let spacer = this.canvasHeight / (number+1) ;
        let c = 1 ;
        for(let i in outputs) {
            // Circle
            this.canvas2dCtx.fillStyle = outputs[i].state === 0 ? "black" : "red";
            this.canvas2dCtx.beginPath() ;
            this.canvas2dCtx.arc(this.canvasWidth-Drawer.dim.io.x, (spacer*c), Drawer.dim.io.r, 0, Math.PI * 2, false) ;
            this.canvas2dCtx.fill();

            // Label
            this.canvas2dCtx.font = "12px Monospace";
            this.canvas2dCtx.fillStyle = "black";
            this.canvas2dCtx.fillText(outputs[i].label, this.canvasWidth-50, (spacer*c)+5);

            outputs[i].x = this.canvasWidth-Drawer.dim.io.x ;
            outputs[i].y = spacer*c ;
            c++ ;
        }
    }

    clearOutputs() {
        this.canvas2dCtx.fillStyle = this.backgroundColor;
        this.canvas2dCtx.fillRect(this.canvasWidth-Drawer.dim.io.b+2, 0, this.canvasWidth, this.canvasHeight);
    }

    drawConnection(sx, sy, ex, ey, state = 0, anchors) {
        this.canvas2dCtx.strokeStyle = state === 0 ? "black" : "red" ;
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(sx, sy) ;

        if(anchors && anchors.length) {
            let points = [...anchors, {x: ex, y: ey}] ;
            for(let i in points) {
                this.canvas2dCtx.lineTo(points[i].x, points[i].y) ;
            }
        } else {
            this.canvas2dCtx.lineTo(ex, ey) ;
        }

        this.canvas2dCtx.stroke() ;
    }
}
