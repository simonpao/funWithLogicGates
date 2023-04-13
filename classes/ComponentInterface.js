class ComponentInterface {

    items = {} ;
    propagating = [] ;
    inputs = {} ;
    outputs = {} ;
    connections = [] ;

    propagateState(input) {
        let cons = this.getConnectionsByInput(input.id) ;
        if(!cons.length) return ;

        if(this.propagating.includes(input.id))
            return ;
        this.propagating.push(input.id) ;

        for(let c in cons) {
            cons[c].state = input.state ;
            cons[c].output.state = input.state ;

            let idParts = cons[c].output.id.split('_') ;
            if(idParts.length === 3) {
                let item = this.getItem(idParts[0]) ;
                item.determineInputState() ;
                for(let i in item.inputs) {
                    this.propagateState(item.inputs[i]) ;
                }
            }
        }
        this.propagating = [] ;
    }

    getItem(id) {
        return this.items[id] ;
    }

    getConnectionsByInput(input) {
        let resp = [] ;
        for(let c in this.connections) {
            if(this.connections[c].input.id === input)
                resp.push(this.connections[c]) ;
        }
        return resp ;
    }
}