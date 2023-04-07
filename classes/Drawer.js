class Drawer {
    static dim = {
        io: {
            x: 65,
            r: 10,
            b: 80
        }
    }

    constructor(canvas2dCtx, w, h, logLvl = Logger.logLvl.INFO) {
        this.logger = new Logger(logLvl, "Drawer") ;

        this.canvas2dCtx = canvas2dCtx ;
        this.canvasWidth = w ;
        this.canvasHeight = h ;
        this.clearCanvas() ;
    }

    clearCanvas() {
        // Whiteout whole canvas
        this.canvas2dCtx.fillStyle = "white";
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
            this.canvas2dCtx.font = "16px Arial";
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
        this.canvas2dCtx.fillStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(x, y+(h/4)) ;
        this.canvas2dCtx.lineTo(x+10, y+(h/4)) ;
        this.canvas2dCtx.stroke() ;

        // Input 2
        this.canvas2dCtx.fillStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath() ;
        this.canvas2dCtx.moveTo(x, (y+h)-(h/4)) ;
        this.canvas2dCtx.lineTo(x+10, (y+h)-(h/4)) ;
        this.canvas2dCtx.stroke() ;

        // Output 1
        this.canvas2dCtx.fillStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath() ;
        this.canvas2dCtx.moveTo(x+w, y+(h/2)) ;
        this.canvas2dCtx.lineTo((x+w)-10, y+(h/2)) ;
        this.canvas2dCtx.stroke() ;

        // Label
        this.canvas2dCtx.font = "16px Arial";
        this.canvas2dCtx.fillStyle = "white";
        this.canvas2dCtx.fillText("AND", x+20, y+31);
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
        this.canvas2dCtx.fillStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(x+10, y+(h/4)) ;
        this.canvas2dCtx.lineTo(x+20, y+(h/4)) ;
        this.canvas2dCtx.stroke() ;

        // Input 2
        this.canvas2dCtx.fillStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(x+10, (y+h)-(h/4)) ;
        this.canvas2dCtx.lineTo(x+20, (y+h)-(h/4)) ;
        this.canvas2dCtx.stroke() ;

        // Output 1
        this.canvas2dCtx.fillStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath() ;
        this.canvas2dCtx.moveTo(x+w, y+(h/2)) ;
        this.canvas2dCtx.lineTo((x+w)-10, y+(h/2)) ;
        this.canvas2dCtx.stroke() ;

        // Label
        this.canvas2dCtx.font = "16px Arial";
        this.canvas2dCtx.fillStyle = "white";
        this.canvas2dCtx.fillText("OR", x+30, y+31);
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
        this.canvas2dCtx.fillStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(x, y+(h/2)) ;
        this.canvas2dCtx.lineTo(x+10, y+(h/2)) ;
        this.canvas2dCtx.stroke() ;

        // Output 1
        this.canvas2dCtx.fillStyle = "black";
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(x+w, y+(h/2)) ;
        this.canvas2dCtx.lineTo((x+w)-10, y+(h/2)) ;
        this.canvas2dCtx.stroke() ;

        // Label
        this.canvas2dCtx.font = "16px Arial";
        this.canvas2dCtx.fillStyle = "white";
        this.canvas2dCtx.fillText("NOT", x+13, y+31);
    }

    fillCustom(name, componentSpec, x, y, w, h, color) {
        this.canvas2dCtx.fillStyle = color;
        this.canvas2dCtx.fillRect(x+10, y, w-20, h);

        // Inputs
        let marginY = h/(componentSpec.numberOfInputs+1) ;
        for(let i = 0; i < componentSpec.numberOfInputs; i++) {
            let posY = y+(marginY*(i+1)) ;
            this.canvas2dCtx.fillStyle = "black";
            this.canvas2dCtx.lineWidth = "5" ;
            this.canvas2dCtx.beginPath();
            this.canvas2dCtx.moveTo(x, posY) ;
            this.canvas2dCtx.lineTo(x+10, posY) ;
            this.canvas2dCtx.stroke() ;
        }

        // Outputs
        marginY = h/(componentSpec.numberOfOutputs+1) ;
        for(let i = 0; i < componentSpec.numberOfOutputs; i++) {
            let posY = y+(marginY*(i+1)) ;
            this.canvas2dCtx.fillStyle = "black";
            this.canvas2dCtx.lineWidth = "5";
            this.canvas2dCtx.beginPath();
            this.canvas2dCtx.moveTo(x + w, posY);
            this.canvas2dCtx.lineTo((x + w) - 10, posY);
            this.canvas2dCtx.stroke();
        }

        this.canvas2dCtx.font = "16px Arial";
        this.canvas2dCtx.fillStyle = "white";
        this.canvas2dCtx.fillText(name, x+(w/3.5), y+(h/1.75));
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
            this.canvas2dCtx.font = "12px Arial";
            this.canvas2dCtx.fillStyle = "black";
            this.canvas2dCtx.fillText(inputs[i].label, 5, (spacer*c)+5);

            inputs[i].x = 65 ;
            inputs[i].y = spacer*c ;
            c++ ;
        }
    }

    clearInputs() {
        this.canvas2dCtx.fillStyle = "white";
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
            this.canvas2dCtx.font = "12px Arial";
            this.canvas2dCtx.fillStyle = "black";
            this.canvas2dCtx.fillText(outputs[i].label, this.canvasWidth-50, (spacer*c)+5);

            outputs[i].x = this.canvasWidth-Drawer.dim.io.x ;
            outputs[i].y = spacer*c ;
            c++ ;
        }
    }

    clearOutputs() {
        this.canvas2dCtx.fillStyle = "white";
        this.canvas2dCtx.fillRect(this.canvasWidth-Drawer.dim.io.b+2, 0, this.canvasWidth, this.canvasHeight);
    }

    drawConnection(sx, sy, ex, ey, state = 0) {
        this.canvas2dCtx.strokeStyle = state === 0 ? "black" : "red" ;
        this.canvas2dCtx.lineWidth = "5" ;
        this.canvas2dCtx.beginPath();
        this.canvas2dCtx.moveTo(sx, sy) ;
        this.canvas2dCtx.lineTo(ex, ey) ;
        this.canvas2dCtx.stroke() ;
    }
}
