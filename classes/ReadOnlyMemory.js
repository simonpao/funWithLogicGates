class ReadOnlyMemory extends Item {
    constructor(lookUpTable, id, x, y, w, h, color) {
        super(Component.types.ROM, id, x, y, w, h, color, lookUpTable.numOut, lookUpTable.numIn) ;
        this.name = lookUpTable.name ;
        this.lookUpTable = lookUpTable ;

        let inputKeys = lookUpTable.inLabels ;
        let outputKeys = lookUpTable.outLabels ;

        for(let i in this.inputs) {
            this.inputs[i].id = `${id}_in_${i}` ;
            this.inputs[i].label = outputKeys[i] ;
        }
        for(let i in this.outputs) {
            this.outputs[i].id = `${id}_out_${i}` ;
            this.outputs[i].label = inputKeys[i] ;
        }

        this.updateIOLocations() ;
    }

    updateIOLocations() {
        // Inputs
        let marginY = this.h/(this.lookUpTable.numIn+1) ;
        for(let i = 0; i < this.lookUpTable.numIn; i++) {
            let posY = this.y+(marginY*(i+1))+5 ;
            this.outputs[i].x = this.x + 5 ;
            this.outputs[i].y = posY ;
        }

        // Outputs
        marginY = this.h/(this.lookUpTable.numOut+1) ;
        for(let i = 0; i < this.lookUpTable.numOut; i++) {
            let posY = this.y+(marginY*(i+1))+5 ;
            this.inputs[i].x = (this.x + this.w) - 5 ;
            this.inputs[i].y = posY ;
        }
    }

    determineInputState() {
        let input = "" ;
        for(let i in this.outputs) {
            input = this.outputs[i].state + input ;
        }

        let output = this.lookUpTable.values[input].split("") ;
        for(let o in this.inputs) {
            this.inputs[o].state = parseInt(output[o]);
        }
    }
}