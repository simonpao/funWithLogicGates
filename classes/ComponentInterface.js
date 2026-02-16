class ComponentInterface {

    items = {} ;
    propagating = [] ;
    inputs = {} ;
    outputs = {} ;
    connections = [] ;
    connectionsByInput = new Map() ;  // Performance: O(1) lookup by input ID

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
        // Performance: O(1) Map lookup instead of O(n) array filter
        return this.connectionsByInput.get(input) || [] ;
    }

    addConnectionToIndex(connection) {
        const inputId = connection.input.id || connection.input ;
        if(!this.connectionsByInput.has(inputId)) {
            this.connectionsByInput.set(inputId, []) ;
        }
        this.connectionsByInput.get(inputId).push(connection) ;
    }

    removeConnectionFromIndex(connection) {
        const inputId = connection.input.id || connection.input ;
        if(this.connectionsByInput.has(inputId)) {
            const connections = this.connectionsByInput.get(inputId) ;
            const index = connections.indexOf(connection) ;
            if(index > -1) {
                connections.splice(index, 1) ;
            }
            if(connections.length === 0) {
                this.connectionsByInput.delete(inputId) ;
            }
        }
    }

    rebuildConnectionIndex() {
        this.connectionsByInput.clear() ;
        // Handle both array and object (from for...in deserialization)
        for(let key in this.connections) {
            const conn = this.connections[key] ;
            this.addConnectionToIndex(conn) ;
        }
    }
}