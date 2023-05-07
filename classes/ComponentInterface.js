class ComponentInterface {

    items = {} ;
    propagating = [] ;
    inputs = {} ;
    outputs = {} ;
    connections = [] ;

    propagateStates(inputs, counter, before) {
        if(!counter) counter = { count: 0 } ;
        for(let i in inputs) {
            if(typeof before === "function") before(i) ;
            this.#propagateStateActual(inputs[i], counter) ;
        }
    }

    propagateState(input, counter) {
        if(!counter) counter = { count: 0 } ;
        this.#propagateStateActual(input, counter) ;
    }

    #propagateStateActual(input, counter) {
        let cons = this.getConnectionsByInput(input.id) ;
        if(!cons.length) return ;

        if(this.propagating.includes(input))
            return ;
        this.propagating.push(input) ;

        counter.count++ ;

        for(let c in cons) {
            cons[c].state = input.state ;
            cons[c].output.state = input.state ;

            let idParts = cons[c].output.id.split('_') ;
            if(idParts.length === 3) {
                let item = this.getItem(idParts[0]) ;
                item.determineInputState(counter) ;
                for(let i in item.inputs) {
                    this.#propagateStateActual(item.inputs[i], counter) ;
                }
            }
        }
        this.propagating = [] ;
    }

    getItem(id) {
        return this.items[id] ;
    }

    getConnectionsByInput(input) {
        return this.connections.filter(item => item.input.id === input) ;
    }
}