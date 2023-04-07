class FunWithLogicGates {
    components = {} ;

    constructor(id, logLvl) {
        this.logger = new Logger(logLvl, "FunWithLogicGates") ;
        this.storage = new Storage('state') ;

        this.loadState() ;

        this.logger.debug(`Initializing canvas on element '#${id}'`) ;
        this.currentComponent = new Component(id, logLvl, this.components) ;
        this.logger.debug(`Initializing toolbar below element '#${id}'`) ;
        this.toolbar = new Toolbar(this.currentComponent, logLvl, this.components) ;

        this.initSaveButton() ;
    }

    initSaveButton() {
        this.saveBtn = document.getElementById("save-component--button") ;
        this.saveBtn.addEventListener("click", this.saveComponent.bind(this)) ;
    }

    async saveComponent() {
        if(!Object.keys(this.currentComponent.inputs).length || !Object.keys(this.currentComponent.outputs).length) {
            new ToastMessage("Need at least one input and one output to save component.", ToastMessage.ERROR).show() ;
            return ;
        }

        let componentName = await this.promptForComponentName() ;

        if(componentName) {
            this.components[componentName] = new AbstractedComponentSpec(this.currentComponent) ;
            this.toolbar.addNewComponent(componentName, this.components[componentName]) ;
            this.currentComponent.clearCanvasState() ;
            this.updateState() ;
        }
    }

    promptForComponentName() {
        this.currentComponent.placeholder.innerHTML = `<div id="canvas-mask--div"></div><div id='save-component--div'><span class="save-component-close--span">&#10006;</span><div>`+
            `<input type="text" maxlength="10" id="save-component--input" placeholder="New Component Name" onkeyup="this.value = this.value.toUpperCase();">`+
            `<button id="save-component--button">Save</button>` +
            `</div></div>` ;

        return new Promise((resolve) => {
            let save = document.querySelector(`#save-component--div #save-component--button`) ;
            let close  = document.querySelector(`#save-component--div .save-component-close--span`) ;
            let labelIn = document.querySelector(`#save-component--div #save-component--input`) ;
            labelIn.select() ;
            labelIn.focus() ;

            save.addEventListener("click", () => {
                let componentName = document.querySelector(`#save-component--div #save-component--input`).value ;

                if(!componentName) {
                    new ToastMessage("Component name is required.", ToastMessage.ERROR).show() ;
                    return ;
                }

                if(Object.keys(this.components).includes(componentName)) {
                    new ToastMessage("Component with this name already exists.", ToastMessage.ERROR).show() ;
                    return ;
                }

                this.currentComponent.placeholder.innerHTML = "" ;
                resolve(componentName) ;
            }) ;
            close.addEventListener("click", () => {
                this.currentComponent.placeholder.innerHTML = "" ;
                resolve(false) ;
            }) ;
        }) ;
    }

    updateState() {
        this.storage.setObject({
            components: this.components
        }) ;
    }

    loadState() {
        let state = this.storage.getObject() ;

        for(let i in state.components) {
            this.logger.debug(`Loading component ${i}`) ;
            this.components[i] = new AbstractedComponentSpec(
                new Component(null, null, this.components, state.components[i])
            )
        }
    }

    async clearAllState() {
        if(!await new ToastMessage("Are you sure you want to clear EVERYTHING?").confirm())
            return ;

        this.storage.setObject({}) ;
        this.toolbar.resetToolbar() ;
        this.initSaveButton() ;
        this.currentComponent.clearCanvasState() ;
        this.components = {} ;
    }
}
