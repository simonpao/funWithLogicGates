class AbstractedComponent extends Item {
    constructor(name, spec, specs, id, x, y, w, h, color) {
        super(Component.types.CUSTOM, id, x, y, w, h, color, spec.numberOfOutputs, spec.numberOfInputs) ;

        this.spec = new AbstractedComponentSpec(
            AbstractedComponentSpec.copyNewComponentSpec(spec, specs)
        ) ;
        this.name = name ;

        let inputKeys = Object.keys(this.spec.inputs) ;
        let outputKeys = Object.keys(this.spec.outputs) ;

        for(let i in this.inputs) {
            this.inputs[i].id = `${id}_in_${i}` ;
            this.inputs[i].specId = outputKeys[i] ;
            this.inputs[i].label = this.spec.outputs[outputKeys[i]].label ;
        }
        for(let i in this.outputs) {
            this.outputs[i].id = `${id}_out_${i}` ;
            this.outputs[i].specId = inputKeys[i] ;
            this.outputs[i].label = this.spec.inputs[inputKeys[i]].label ;
        }

        this.updateIOLocations() ;
    }

    updateIOLocations() {
        // Inputs
        let marginY = this.h/(this.spec.numberOfInputs+1) ;
        for(let i = 0; i < this.spec.numberOfInputs; i++) {
            let posY = this.y+(marginY*(i+1))+5 ;
            this.outputs[i].x = this.x + 5 ;
            this.outputs[i].y = posY ;
        }

        // Outputs
        marginY = this.h/(this.spec.numberOfOutputs+1) ;
        for(let i = 0; i < this.spec.numberOfOutputs; i++) {
            let posY = this.y+(marginY*(i+1))+5 ;
            this.inputs[i].x = (this.x + this.w) - 5 ;
            this.inputs[i].y = posY ;
        }

    }

    determineInputState() {
        let inIds = Object.keys(this.spec.inputs) ;
        let outIds = Object.keys(this.spec.outputs) ;

        for(let i of inIds) {
            this.spec.inputs[i].state = this.outputs.filter(item => item.specId === i)[0].state ;
            this.spec.propagateState(this.spec.inputs[i]) ;
        }

        for(let o of outIds) {
            this.inputs.filter(item => item.specId === o)[0].state = this.spec.outputs[o].state ;
        }
    }

    toJSON() {
        return {
            spec: this.name,
            type: this.type,
            id: this.id,
            x: this.x,
            y: this.y,
            w: this.w,
            h: this.h,
            color: this.color,
            inputs: this.inputs,
            outputs: this.outputs
        } ;
    }

}