class Or extends Item {
    constructor(id, x, y, w, h, color) {
        super(Component.types.OR, id, x, y, w, h, color, 1, 2) ;

        this.updateIOLocations() ;
    }

    updateIOLocations() {
        this.outputs[0].x = this.x+15 ;
        this.outputs[0].y = this.y+(this.h/4) ;
        this.outputs[1].x = this.x+15 ;
        this.outputs[1].y = (this.y+this.h)-(this.h/4) ;
        this.inputs[0].x = (this.x+this.w)-5 ;
        this.inputs[0].y = this.y+(this.h/2) ;
    }

    determineInputState() {
        let in1 = this.outputs[0].state ;
        let in2 = this.outputs[1].state ;
        this.inputs[0].state = in1 | in2 ;
    }
}
