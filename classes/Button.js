class Button {
    constructor(text, x, y, w, h, cw, color, callback) {
        this.text = text ;
        this.x = x ;
        this.y = y ;
        this.w = w ;
        this.h = h ;
        this.cw = cw ;
        this.color = color ;
        this.callback = callback ;
    }

    render(canvas2dCtx, hover = false) {
        canvas2dCtx.fillStyle = hover ? "white" : this.color ;
        canvas2dCtx.fillRect(this.x, this.y, this.w, this.h);

        canvas2dCtx.strokeStyle = hover ? this.color : "black" ;
        canvas2dCtx.lineWidth = "1" ;
        canvas2dCtx.strokeRect(this.x, this.y, this.w, this.h) ;

        canvas2dCtx.font = "bold 28px Monospace";
        canvas2dCtx.fillStyle = hover ? this.color : "white";
        canvas2dCtx.fillText(this.text, this.x+(this.w/2-(this.text.length*15.5)/2), this.y+33);

        // Input 1
        canvas2dCtx.strokeStyle = hover ? "red" : "black";
        canvas2dCtx.lineWidth = "5" ;
        canvas2dCtx.beginPath();
        canvas2dCtx.moveTo(this.x, this.y+(this.h/4)) ;
        canvas2dCtx.lineTo(0, this.y+(this.h/4)) ;
        canvas2dCtx.stroke() ;

        canvas2dCtx.font = "14px Monospace";
        canvas2dCtx.fillStyle = hover ? this.color : "white";
        canvas2dCtx.fillText("IN0", this.x+5, this.y+(this.h/4)+5);

        // Input 2
        canvas2dCtx.beginPath() ;
        canvas2dCtx.moveTo(this.x, (this.y+this.h)-(this.h/4)) ;
        canvas2dCtx.lineTo(0, (this.y+this.h)-(this.h/4)) ;
        canvas2dCtx.stroke() ;

        canvas2dCtx.fillText("IN1", this.x+5, (this.y+this.h)-(this.h/4)+5);

        // Output 1
        canvas2dCtx.beginPath() ;
        canvas2dCtx.moveTo(this.x+this.w, this.y+(this.h/2)) ;
        canvas2dCtx.lineTo(this.cw, this.y+(this.h/2)) ;
        canvas2dCtx.stroke() ;

        canvas2dCtx.fillText("OUT0", (this.x+this.w)-(4*8)-10, this.y+(this.h/2)+5);
    }

    isAtLocation(x,y) {
        return x >= this.x && x <= this.w + this.x &&
            y >= this.y && y <= this.h + this.y;
    }

    execute() {
        this.callback() ;
    }
}