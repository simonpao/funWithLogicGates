class Toolbar {
    static MAX_IO = 25 ;

    constructor(
        component,
        logLvl = Logger.logLvl.INFO,
        savedComponents,
        removeComponentCallback,
        editComponentCallback,
        duplicateComponentCallback
    ) {
        this.logger = new Logger(logLvl, "Toolbar") ;
        this.component = component ;
        this.storage = new Storage('toolbar-state') ;
        this.removeComponentCallback = removeComponentCallback ;
        this.editComponentCallback = editComponentCallback ;
        this.duplicateComponentCallback = duplicateComponentCallback ;

        this.loadToolbarState() ;
        this.logger.debug(`color: ${this.color}`) ;

        this.component.canvas.after(this.generateToolbar()) ;

        for(let i in savedComponents)
            this.addNewComponent(i, savedComponents[i]) ;

        this.setListeners() ;
    }

    setListeners() {
        this.toolbar = document.getElementById('fun-with-logic-gates--nav') ;
        this.colorInput = document.getElementById('add-item--color-input') ;
        this.addAndBtn = document.getElementById('add-and--button') ;
        this.addOrBtn = document.getElementById('add-or--button') ;
        this.addNotBtn = document.getElementById('add-not--button') ;
        this.addInputBtn = document.getElementById('add-input--button') ;
        this.addOutputBtn = document.getElementById('add-output--button') ;
        this.truthBtn = document.getElementById('truth-table--button') ;
        this.clearBtn = document.getElementById('clear-state--button') ;

        this.toolbar.style.width = `${this.component.metadata.canvas.width-10}px` ;
        this.toolbar.style.maxWidth = `99%` ;

        this.colorInput.addEventListener("change", this.setColor.bind(this))
        this.addAndBtn.addEventListener("click", this.newAnd.bind(this)) ;
        this.addOrBtn.addEventListener("click", this.newOr.bind(this)) ;
        this.addNotBtn.addEventListener("click", this.newNot.bind(this)) ;
        this.addInputBtn.addEventListener("click", this.newInput.bind(this)) ;
        this.addOutputBtn.addEventListener("click", this.newOutput.bind(this)) ;
        this.clearBtn.addEventListener("click", this.clearCanvas.bind(this)) ;
        this.truthBtn.addEventListener("click", this.genTruthTable.bind(this)) ;

        document.addEventListener("click", this.removeContextMenu.bind(this)) ;
    }

    generateToolbar() {
        let nav = document.createElement("nav") ;
        nav.id = 'fun-with-logic-gates--nav' ;
        nav.innerHTML = `<input id='add-item--color-input' type='color' value='${this.color}'/>` +
            "<button id='add-and--button'>AND</button>" +
            "<button id='add-or--button'>OR</button>" +
            "<button id='add-not--button'>NOT</button>" +
            "<span id='new-components--span'></span>" +
            "<button id='add-input--button'>Add Input</button>" +
            "<input type='text' maxlength='5' id='add-input--input' placeholder='Input Label' value='IN' onkeyup='this.value = this.value.toUpperCase();'/>" +
            "<button id='add-output--button'>Add Output</button>" +
            "<input type='text' maxlength='5' id='add-output--input' placeholder='Output Label' value='OUT' onkeyup='this.value = this.value.toUpperCase();'/>" +
            "<button id='truth-table--button'>Truth Table</button>" +
            "<button id='clear-state--button'>Clear</button>" +
            "<button id='save-component--button'>Save</button>" ;
        return nav ;
    }

    addNewComponent(name, componentSpec) {
        let span = document.getElementById('new-components--span') ;
        let compBtn = document.createElement("button") ;
        compBtn.id = `add-${name}--button` ;
        compBtn.dataset.type = name ;
        compBtn.innerText = name ;
        span.before(compBtn) ;

        compBtn.addEventListener("click", this.newCustom.bind(this, name, componentSpec)) ;
        compBtn.addEventListener("contextmenu", this.displayContextMenu.bind(this, name));
    }

    displayContextMenu(name, e) {
        let { x, y } = this.component.getDocumentOffset(e) ;
        e.preventDefault() ;

        let node = document.createElement("menu") ;
        node.id = 'context-menu' ;
        node.innerHTML = `<li><button data-name="${name}" id="context-menu--edit">Edit</button></li>` +
            `<li><button data-name="${name}" id="context-menu--duplicate">Duplicate</button></li>` +
            `<li><button data-name="${name}" id="context-menu--delete">Delete</button></li>` ;

        this.component.placeholder.innerHTML = node.outerHTML ;

        let removeComponent = document.getElementById('context-menu--delete') ;
        removeComponent.addEventListener("click", this.removeComponent.bind(this)) ;

        let duplicateComponent = document.getElementById('context-menu--duplicate') ;
        duplicateComponent.addEventListener("click", this.duplicateComponent.bind(this)) ;

        let editComponent = document.getElementById('context-menu--edit') ;
        editComponent.addEventListener("click", this.editComponent.bind(this)) ;

        let menu = document.getElementById('context-menu') ;
        menu.style.top = `${y+15}px` ;
        menu.style.left = `${x-55}px` ;
    }

    async removeComponent(e) {
        let name = e.currentTarget.dataset.name ;
        this.removeContextMenu() ;
        if(await new ToastMessage(
            `Are you sure you want to delete the component ${name}? This cannot be undone.`
        ).confirm()) {
            if (this.removeComponentCallback(name)) {
                let elem = document.getElementById(`add-${name}--button`);
                if (elem) elem.remove();
            }
        }
    }

    async duplicateComponent(e) {
        let name = e.currentTarget.dataset.name ;
        this.removeContextMenu() ;

        if(!this.component.isCanvasInUse() || await new ToastMessage(
            "This will clear the work area and any unsaved work will be lost, do you want to continue?"
        ).confirm()) {
            this.duplicateComponentCallback(name) ;
        }
    }

    async editComponent(e) {
        let name = e.currentTarget.dataset.name ;
        this.removeContextMenu() ;

        if(!this.component.isCanvasInUse() || await new ToastMessage(
            "This will clear the work area and any unsaved work will be lost, do you want to continue?"
        ).confirm()) {
            if (this.editComponentCallback(name)) {
                let elem = document.getElementById(`add-${name}--button`);
                if (elem) elem.remove();
            }
        }
    }

    removeContextMenu() {
        let elem = document.getElementById('context-menu') ;
        if(elem) elem.remove() ;
    }

    setColor() {
        this.color = this.colorInput.value ;
        this.component.color = this.color ;
        this.updateToolbarState() ;
    }

    newAnd() {
        this.component.newItem(Component.types.AND) ;
    }

    newOr() {
        this.component.newItem(Component.types.OR) ;
    }

    newNot() {
        this.component.newItem(Component.types.NOT) ;
    }

    newCustom(name, componentSpec) {
        let type = AbstractedComponent.determineType(name, componentSpec)
        this.component.newItem(type, name, componentSpec) ;
    }

    newInput() {
        if(Object.keys(this.component.inputs).length >= Toolbar.MAX_IO) {
            new ToastMessage(`There is a maximum of ${Toolbar.MAX_IO} inputs.`, ToastMessage.ERROR).show() ;
            return ;
        }
        this.component.addInput() ;
    }

    newOutput() {
        if(Object.keys(this.component.outputs).length >= Toolbar.MAX_IO) {
            new ToastMessage(`There is a maximum of ${Toolbar.MAX_IO} outputs.`, ToastMessage.ERROR).show() ;
            return ;
        }
        this.component.addOutput() ;
    }

    genTruthTable() {
        this.component.generateTruthTable() ;
    }

    async clearCanvas() {
        if(!await new ToastMessage("Are you sure you want to clear the current component?").confirm())
            return ;
        this.component.clearCanvasState() ;
    }

    updateToolbarState() {
        this.storage.setObject({
            color: this.color
        }) ;
    }

    loadToolbarState() {
        let state = this.storage.getObject() ;
        this.color = typeof state.color === "undefined" ? Component.startColor : state.color ;
        this.component.color = this.color ;
    }

    resetToolbar() {
        this.color = Component.startColor ;
        this.storage.setObject({}) ;
        this.toolbar.remove() ;
        this.component.canvas.after(this.generateToolbar()) ;
        this.setListeners() ;
    }
}
