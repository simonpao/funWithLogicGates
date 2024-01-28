class FunWithLogicGates {
    components = {} ;
    builtIn = ['AND', 'OR', 'NOT'] ;
    orientation = Coordinates.orientation.LANDSCAPE ;

    constructor(id, logLvl, options = {}) {
        this.logger = new Logger(logLvl, "FunWithLogicGates") ;
        this.storage = new Storage('state') ;
        this.inFullScreen = false ;
        this.activeSession = false ;
        this.savesList = {} ;
        this.currentSave = "" ;

        if(options.orientation)
            this.orientation = options.orientation ;

        // Move the canvas into a parent wrapper div
        this.canvas = document.getElementById(id) ;
        let parent = this.canvas.parentNode ;
        this.canvasContainer = document.createElement("div") ;
        this.canvasContainer.id = 'canvas-container--div' ;
        parent.replaceChild(this.canvasContainer, this.canvas) ;
        this.canvasContainer.appendChild(this.canvas);
        this.canvas.tabIndex = 1 ;
        this.canvas.classList.add("fun-with-logic-gates--canvas") ;

        this.placeholder = document.createElement("div") ;
        this.placeholder.id = 'new-items-placeholder' ;
        this.canvas.after(this.placeholder) ;

        this.loadState() ;
        if(Object.keys(this.components).length) {
            this.activeSession = true ;
            this.updateState() ;
        }

        this.mainMenu = new MainMenu(this.canvas, this.activeSession, logLvl, {
            startFn: this.initCanvas.bind(this, id, logLvl),
            newFn: this.startNew.bind(this),
            saveFn: this.saveGame.bind(this),
            loadFn: this.loadGame.bind(this)
        }, { orientation: this.orientation }) ;

        if(!this.activeSession) {
            this.logger.debug(`Initializing main menu on element '#${id}'`) ;
            this.mainMenu.renderMainMenu(this.activeSession, this.savesList) ;
        } else {
            this.initCanvas(id, logLvl) ;
        }
    }

    initCanvas(id, logLvl, name) {
        if(name) this.currentSave = name ;
        this.activeSession = true ;
        this.updateState() ;

        this.logger.debug(`Initializing canvas on element '#${id}'`) ;
        this.currentComponent = new Component(
            id,
            logLvl,
            this.components,
            null,
            this.removeComponentCallback.bind(this),
            this.editRomCallback.bind(this),
            { orientation: this.orientation }
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

        this.initButtons() ;
        this.enterFullScreen(null, true) ;
    }

    initButtons() {
        this.saveBtn = document.getElementById("save-component--button") ;
        this.saveBtn.addEventListener("click", this.saveComponent.bind(this)) ;

        this.fullScreenBtn = document.getElementById("full-screen--button") ;
        this.fullScreenBtn.addEventListener("click", this.enterFullScreen.bind(this)) ;

        this.mainMenuBtn = document.getElementById("main-menu--button") ;
        this.mainMenuBtn.addEventListener("click", this.displayMainMenu.bind(this)) ;
    }

    changeOrientation(orientation) {
        this.logger.debug("Change orientation called: orientation = " + orientation) ;
        this.orientation = orientation ;
        this.currentComponent.changeCanvasDimensions(orientation) ;
        this.mainMenu.changeCanvasDimensions(orientation) ;
    }

    displayMainMenu() {
        this.logger.debug(`Initializing main menu`) ;
        this.currentComponent.items = {} ;
        this.currentComponent.inputs = {} ;
        this.currentComponent.outputs = {} ;
        this.currentComponent.connections = [] ;

        this.currentComponent.removeEventListeners() ;
        this.currentComponent.dragging = {} ;
        this.currentComponent.connecting = {} ;
        this.toolbar.toolbar.remove() ;
        this.mainMenu.renderMainMenu(this.activeSession, this.savesList, this.currentSave) ;
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
            this.components[componentName] = new AbstractedComponentSpec(this.currentComponent, componentName) ;
            this.toolbar.addNewComponent(componentName, this.components[componentName]) ;
            this.currentComponent.clearCanvasState() ;
            this.updateState() ;
        }
    }

    async enterFullScreen(e, reinit = false) {
        if(!this.inFullScreen && !reinit) {
            try {
                await this.canvasContainer.requestFullscreen();
            } catch(e) {
                this.logger.error(e) ;
                new ToastMessage("Full screen mode not supported in this browser.", ToastMessage.ERROR).show() ;
                return ;
            }
        }
        else if (!reinit)
            await document.exitFullscreen() ;

        if(!this.changePositionBtn) {
            this.changePositionBtn = document.createElement("button");
            this.changePositionBtn.id = "change-nav-position--button";
            this.changePositionBtn.textContent = this.toolbar.navDockedRight ? "Dock Bottom" : "Dock Right";
            this.changePositionBtn.addEventListener("click", () => {
                if (this.toolbar.navDockedRight) {
                    this.toolbar.toolbar.classList.remove('right-side');
                    this.currentComponent.canvas.classList.remove('nav-right-side');
                    this.changePositionBtn.textContent = "Dock Right";
                    this.toolbar.navDockedRight = false;
                } else {
                    this.toolbar.toolbar.classList.add('right-side');
                    this.currentComponent.canvas.classList.add('nav-right-side');
                    this.changePositionBtn.textContent = "Dock Bottom";
                    this.toolbar.navDockedRight = true;
                }
                this.toolbar.updateToolbarState() ;
            });
            this.fullScreenBtn.after(this.changePositionBtn) ;
        } else if (reinit) {
            this.fullScreenBtn.after(this.changePositionBtn) ;
        }

        let toggleFullScreen = () => {
            if (document.fullscreenElement) {
                this.inFullScreen = true ;
                this.toolbar.inFullScreen = true ;
                this.fullScreenBtn.textContent = "Restore" ;
                this.changePositionBtn.classList.remove('hidden') ;
                this.canvasContainer.classList.add('full-screen') ;
                if(this.toolbar.navDockedRight) {
                    this.toolbar.toolbar.classList.add('right-side');
                    this.currentComponent.canvas.classList.add('nav-right-side');
                }
            }
            else {
                this.inFullScreen = false ;
                this.toolbar.inFullScreen = false ;
                this.fullScreenBtn.textContent = "Full Screen" ;
                this.changePositionBtn.classList.add('hidden') ;
                this.canvasContainer.classList.remove('full-screen') ;
            }
        }

        if (!reinit)
            document.addEventListener('fullscreenchange', () => toggleFullScreen());
        else
            toggleFullScreen() ;
    }

    promptForComponentName() {
        let editing = this.currentComponent.metadata.editing ;
        let mask = document.createElement("div") ;
        let saveDiv = document.createElement("div") ;
        mask.id = "canvas-mask--div" ;
        saveDiv.id = "save-component--div" ;

        saveDiv.innerHTML = `<span class="save-component-close--span">&#10006;</span><div>`+
            `<input type="text" maxlength="10" id="save-component--input" placeholder="New Component Name" value="${editing || ''}">`+
            `<button id="save-component--button">Save</button></div>` ;

        this.currentComponent.placeholder.appendChild(mask) ;
        this.currentComponent.placeholder.appendChild(saveDiv) ;

        return new Promise((resolve) => {
            let save = document.querySelector(`#save-component--div #save-component--button`) ;
            let close  = document.querySelector(`#save-component--div .save-component-close--span`) ;
            let labelIn = document.querySelector(`#save-component--div #save-component--input`) ;
            labelIn.select() ;
            labelIn.focus() ;
            labelIn.addEventListener("input", (e) => {
                e.currentTarget.value = e.currentTarget.value.toUpperCase()
                    .replace(/[^0-9A-Za-z-+]/, "").substring(0,10) ;
            }) ;
            labelIn.addEventListener("keyup", (e) => {
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

                this.currentComponent.placeholder.removeChild(mask) ;
                this.currentComponent.placeholder.removeChild(saveDiv) ;
                resolve(componentName) ;
            }) ;
            close.addEventListener("click", () => {
                this.currentComponent.placeholder.removeChild(mask) ;
                this.currentComponent.placeholder.removeChild(saveDiv) ;
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

    async editRomCallback(lookUpTable) {
        return await this.toolbar.promptForLookUpTable(lookUpTable) ;
    }

    saveGame(name) {
        name = name.toLowerCase() ;
        let lastUpdated = localStorage.getItem('fun-with-logic-gates--last-updated') ;
        this.savesList[name] = { lastUpdated: lastUpdated, numberOfComponents: Object.keys(this.components).length } ;
        this.storage.setObject({
            "canvas-state": this.currentComponent.storage.getObject(),
            "toolbar-state": this.toolbar.storage.getObject(),
            "state": this.storage.getObject(),
            "last-updated": lastUpdated
        }, "save-" + name) ;

        // Dispatch a save event so other applications can handle save data if they wish
        this.logger.debug("dispatching save event") ;
        let saveEvt = new Event("saveGame") ;
        saveEvt.saveName = name ;
        saveEvt.saveId = "fun-with-logic-gates--state--save-" + name ;
        saveEvt.lastUpdated = this.savesList[name].lastUpdated ;
        saveEvt.numberOfComponents = this.savesList[name].numberOfComponents ;
        this.canvas.dispatchEvent(saveEvt) ;

        this.updateState() ;
    }

    loadGame(name) {
        let state = this.storage.getObject("save-" + name) ;
        if(Object.keys(state).length === 0) {
            new ToastMessage("Failed to load save", ToastMessage.ERROR).show() ;
            return false;
        }

        this.currentSave = name ;
        state["state"].savesList = this.savesList ;
        this.storage.setObject(state["state"]) ;
        this.currentComponent.storage.setObject(state["canvas-state"]) ;
        this.toolbar.storage.setObject(state["toolbar-state"]) ;

        this.components = {} ;
        this.loadState() ;
        return true ;
    }

    updateState() {
        this.storage.setObject({
            activeSession: this.activeSession,
            savesList: this.savesList,
            components: this.components,
            currentSave: this.currentSave
        }) ;
    }

    loadState() {
        let state = this.storage.getObject() ;
        this.activeSession = state.activeSession ;
        this.savesList = typeof state.savesList === "undefined" ? {} : state.savesList ;
        this.currentSave = typeof state.currentSave === "undefined" ? "" : state.currentSave ;

        for(let i in state.components) {
            this.logger.debug(`Loading component ${i}`) ;
            this.components[i] = new AbstractedComponentSpec(
                new Component(null, null, this.components, state.components[i]), i
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

    startNew() {
        this.#actuallyClearAllState() ;
    }

    #actuallyClearAllState() {
        this.storage.setObject({}) ;
        this.toolbar.resetToolbar() ;
        this.initButtons() ;
        this.currentComponent.clearCanvasState() ;
        this.components = {} ;
    }
}
