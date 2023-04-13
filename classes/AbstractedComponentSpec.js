class AbstractedComponentSpec extends ComponentInterface {
    constructor(component) {
        super();

        this.items = component.items ;
        this.inputs = component.inputs ;
        this.outputs = component.outputs ;
        this.connections = component.connections ;

        this.numberOfInputs = Object.keys(this.inputs).length ;
        this.numberOfOutputs = Object.keys(this.outputs).length ;
    }

    static copyNewComponentSpec(state, specs) {
        return Component.copyNewComponent(JSON.parse(JSON.stringify(state)), specs) ;
    }
}