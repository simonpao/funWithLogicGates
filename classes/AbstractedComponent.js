class AbstractedComponent extends Item {
    constructor(name, type, spec, specs, id, x, y, w, h, color) {
        super(type, id, x, y, w, h, color, spec.numberOfOutputs, spec.numberOfInputs) ;

        this.spec = new AbstractedComponentSpec(
            AbstractedComponentSpec.copyNewComponentSpec(spec, specs), name
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
        switch(this.type) {
            case Component.types.CUSTOM:
                this.#updateCustomIOLocations() ;
                break ;
            case Component.types.XOR:
            case Component.types.NOR:
            case Component.types.XNOR:
            case Component.types.NAND:
                this.#update2InIOLocations() ;
                break ;
            case Component.types.BUF:
                this.#update1InIOLocations() ;
                break ;
        }
    }

    #updateCustomIOLocations() {
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

    #update2InIOLocations() {
        this.outputs[0].x = this.x+5 ;
        this.outputs[0].y = this.y+(this.h/4) ;
        this.outputs[1].x = this.x+5 ;
        this.outputs[1].y = (this.y+this.h)-(this.h/4) ;
        this.inputs[0].x = (this.x+this.w)-5 ;
        this.inputs[0].y = this.y+(this.h/2) ;
    }

    #update1InIOLocations() {
        this.outputs[0].x = this.x+5 ;
        this.outputs[0].y = this.y+(this.h/2) ;
        this.inputs[0].x = (this.x+this.w)-5 ;
        this.inputs[0].y = this.y+(this.h/2) ;
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

    static determineType(name, spec) {
        let numOut = spec.numberOfOutputs, numIn = spec.numberOfInputs ;
        if(numOut > 1 || numIn > 2)
            return Component.types.CUSTOM ;

        switch(name) {
            case "XOR":
                if(numOut === 1 || numIn === 2)
                    return Component.types.XOR ;
                break ;
            case "NOR":
                if(numOut === 1 || numIn === 2)
                    return Component.types.NOR ;
                break ;
            case "XNOR":
                if(numOut === 1 || numIn === 2)
                    return Component.types.XNOR ;
                break ;
            case "NAND":
                if(numOut === 1 || numIn === 2)
                    return Component.types.NAND ;
                break ;
            case "BUF":
                if(numOut === 1 || numIn === 1)
                    return Component.types.BUF ;
                break ;
        }

        return Component.types.CUSTOM ;
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