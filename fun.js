class FunWithLogicGates {
    components = {} ;
    builtIn = ['AND', 'OR', 'NOT'] ;

    constructor(id, logLvl) {
        this.logger = new Logger(logLvl, "FunWithLogicGates") ;
        this.storage = new Storage('state') ;

        this.loadState() ;

        this.logger.debug(`Initializing canvas on element '#${id}'`) ;
        this.currentComponent = new Component(
            id,
            logLvl,
            this.components,
            null,
            this.removeComponentCallback.bind(this)
        ) ;
        this.logger.debug(`Initializing toolbar below element '#${id}'`) ;
        this.toolbar = new Toolbar(
            this.currentComponent,
            logLvl,
            this.components,
            this.removeComponentCallback.bind(this),
            this.editComponentCallback.bind(this),
            this.duplicateComponentCallback.bind(this)
        ) ;

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
            if(this.currentComponent.metadata.editing && componentName !== this.currentComponent.metadata.editing)
                delete this.components[this.currentComponent.metadata.editing] ;
            this.currentComponent.metadata.editing = false ;
            this.components[componentName] = new AbstractedComponentSpec(this.currentComponent) ;
            this.toolbar.addNewComponent(componentName, this.components[componentName]) ;
            this.currentComponent.clearCanvasState() ;
            this.updateState() ;
        }
    }

    promptForComponentName() {
        let editing = this.currentComponent.metadata.editing ;
        this.currentComponent.placeholder.innerHTML = `<div id="canvas-mask--div"></div>`+
            `<div id='save-component--div'><span class="save-component-close--span">&#10006;</span><div>`+
            `<input type="text" maxlength="10" id="save-component--input" placeholder="New Component Name" value="${editing || ''}">`+
            `<button id="save-component--button">Save</button>` +
            `</div></div>` ;

        return new Promise((resolve) => {
            let save = document.querySelector(`#save-component--div #save-component--button`) ;
            let close  = document.querySelector(`#save-component--div .save-component-close--span`) ;
            let labelIn = document.querySelector(`#save-component--div #save-component--input`) ;
            labelIn.select() ;
            labelIn.focus() ;
            labelIn.addEventListener("keyup", (e) => {
                e.currentTarget.value = e.currentTarget.value.toUpperCase() ;
                if(e.which === 13) {
                    save.dispatchEvent(new Event("click")) ;
                }
            }) ;

            save.addEventListener("click", () => {
                let componentName = document.querySelector(`#save-component--div #save-component--input`).value ;

                if(!componentName) {
                    new ToastMessage("Component name is required.", ToastMessage.ERROR).show() ;
                    return ;
                }

                if((componentName !== this.currentComponent.metadata.editing &&
                    Object.keys(this.components).includes(componentName)) ||
                    this.builtIn.includes(componentName)) {
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

    removeComponentCallback(name) {
        let dependant = this.checkComponentDependencies(name) ;
        if(dependant) {
            new ToastMessage(`This component cannot be deleted because ${dependant} uses it.`, ToastMessage.ERROR).show() ;
            return false ;
        }
        delete this.components[name] ;
        this.updateState() ;
        return true ;
    }

    editComponentCallback(name) {
        let dependant = this.checkComponentDependencies(name) ;
        if(dependant) {
            new ToastMessage(`This component cannot be edited because ${dependant} uses it.`, ToastMessage.ERROR).show() ;
            return false ;
        }
        this.currentComponent.loadComponentSpec(name, this.components[name], true) ;
        return true ;
    }

    duplicateComponentCallback(name) {
        this.currentComponent.loadComponentSpec(name, this.components[name], false) ;
    }

    checkComponentDependencies(name) {
        for(let i in this.components) {
            for(let j in this.components[i].items) {
                if(this.components[i].items[j].name === name)
                    return i ;
            }
        }
        return false ;
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

    loadAllState() {
        this.components = {} ;
        this.currentComponent.items = {} ;
        this.currentComponent.inputs = {} ;
        this.currentComponent.outputs = {} ;
        this.currentComponent.connections = [] ;

        this.loadState() ;
        this.toolbar.loadToolbarState() ;
        this.currentComponent.loadCanvasState() ;

        this.toolbar.toolbar.replaceWith(this.toolbar.generateToolbar()) ;

        for(let i in this.components)
            this.toolbar.addNewComponent(i, this.components[i]) ;

        this.toolbar.setListeners() ;
    }

    async clearAllState() {
        if(!await new ToastMessage("Are you sure you want to clear EVERYTHING?").confirm())
            return ;

        this.#actuallyClearAllState() ;
    }

    #actuallyClearAllState() {
        this.storage.setObject({}) ;
        this.toolbar.resetToolbar() ;
        this.initSaveButton() ;
        this.currentComponent.clearCanvasState() ;
        this.components = {} ;
    }
}
