class SettingsButton extends Button {
    constructor(text, x, y, w, color, callback, options = {}) {
        super(text, x, y, w, 30, 0, color, callback);
        this.inverseColor = options.inverseColor ;
    }

    render(canvas2dCtx, hover = false) {
        canvas2dCtx.fillStyle = hover ? this.inverseColor : this.color ;
        canvas2dCtx.fillRect(this.x, this.y, this.w, this.h);

        canvas2dCtx.strokeStyle = hover ? this.color : this.inverseColor ;
        canvas2dCtx.lineWidth = "1" ;
        canvas2dCtx.strokeRect(this.x, this.y, this.w, this.h) ;

        canvas2dCtx.font = "16px Monospace" ;
        canvas2dCtx.fillStyle = hover ? this.color : this.inverseColor ;
        canvas2dCtx.fillText(this.text, this.x+(this.w/3-(this.text.length*5.5)/2), this.y+20);
    }
}