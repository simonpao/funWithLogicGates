class Connection {
    constructor(i, o) {
        let temp ;
        if(i.constructor.name === "Output") {
            temp = i ;
            i = o ;
            o = temp ;
        }

        this.input = i ;
        this.output = o ;
        this.state = 0 ;

        i.connected = o.connected = true ;
        i.connectedTo = o ;
        o.connectedTo = i ;
        i.connection = o.connection = this ;
    }

    toggleState() {
        this.state = this.state === 0 ? 1 : 0 ;
    }

    static fromIds(fwlg, inputId, outputId) {
        return new Connection(fwlg.getInput(inputId), fwlg.getOutput(outputId)) ;
    }

    toJSON() {
        return {
            input: this.input.id,
            output: this.output.id,
            state: this.state
        } ;
    }
}
