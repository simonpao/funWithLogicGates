class Item {
    constructor(type, id, x, y, w, h, color, inputs, outputs) {
        this.type = type;
        this.id = id;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = color;
        this.inputs = [] ;
        this.outputs = [] ;

        for(let i = 0; i < inputs; i++)
            this.inputs[i] = new Input(`${id}_in_${i}`, "", 0) ;
        for(let i = 0; i < outputs; i++)
            this.outputs[i] = new Output(`${id}_out_${i}`, "", 0) ;
    }

    getInput(index) {
        if(index >= this.inputs.length)
            return false ;
        return this.inputs[index] ;
    }

    getOutput(index) {
        if(index >= this.outputs.length)
            return false ;
        return this.outputs[index] ;
    }
}
