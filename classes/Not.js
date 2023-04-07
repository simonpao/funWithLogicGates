class Not extends Item {
    constructor(id, x, y, w, h, color) {
        super(Component.types.NOT, id, x, y, w, h, color, 1, 1) ;
        this.state = 1 ;
        this.updateIOLocations() ;
    }

    updateIOLocations() {
        this.outputs[0].x = this.x+5 ;
        this.outputs[0].y = this.y+(this.h/2) ;
        this.inputs[0].x = (this.x+this.w)-5 ;
        this.inputs[0].y = this.y+(this.h/2) ;
    }

    determineInputState() {
        let in1 = this.outputs[0].state ;
        this.inputs[0].state = in1 === 1 ? 0 : 1 ;
    }
}
