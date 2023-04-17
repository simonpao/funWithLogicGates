class SevenSegmentDisplay extends Item {
    labels = ["DP", "A", "B", "C", "D", "E", "F", "G"] ;
    state = [0,0,0,0,0,0,0,0] ;

    constructor(id, x, y, w, h, state) {
        super(Component.types.SEVENSEG, id, x, y, w, h, "#333333", 0, 8) ;

        if(typeof state !== "undefined")
            this.state = state ;

        for(let i in this.inputs) {
            this.inputs[i].id = `${id}_in_${i}` ;
            this.inputs[i].label = this.labels[i] ;
        }

        this.updateIOLocations() ;
    }

    updateIOLocations() {
        // Inputs
        let marginY = this.h/(this.labels.length+1) ;
        for(let i = 0; i < this.labels.length; i++) {
            let posY = this.y+(marginY*(i+1)) ;
            this.outputs[i].x = this.x + 5 ;
            this.outputs[i].y = posY ;
        }
    }

    determineInputState() {
        let dp = this.outputs[0].state,
            a = this.outputs[1].state,
            b = this.outputs[2].state,
            c = this.outputs[3].state,
            d = this.outputs[4].state,
            e = this.outputs[5].state,
            f = this.outputs[6].state,
            g = this.outputs[7].state ;

        this.state = [a,b,c,d,e,f,g,dp] ;
    }

}