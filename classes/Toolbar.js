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
        this.inFullScreen = false ;
        this.navDockedRight = false ;

        this.loadToolbarState() ;
        this.logger.debug(`color: ${this.color}`) ;

        this.component.canvas.after(this.generateToolbar()) ;

        for(let i in savedComponents)
            this.addNewComponent(i, savedComponents[i]) ;

        this.setListeners() ;
    }

    setListeners() {
        this.toolbar = document.getElementById('fun-with-logic-gates--nav') ;
        this.componentScroll = document.getElementById('components--div') ;
        this.colorInput = document.getElementById('add-item--color-input') ;
        this.addAndBtn = document.getElementById('add-and--button') ;
        this.addOrBtn = document.getElementById('add-or--button') ;
        this.addNotBtn = document.getElementById('add-not--button') ;
        this.addRomBtn = document.getElementById('add-rom--button') ;
        this.add7SegBtn = document.getElementById('add-seven-seg--button') ;
        this.addInputBtn = document.getElementById('add-input--button') ;
        this.addOutputBtn = document.getElementById('add-output--button') ;
        this.truthBtn = document.getElementById('truth-table--button') ;
        this.clearBtn = document.getElementById('clear-state--button') ;

        this.toolbar.style.width = `${this.component.metadata.canvas.width-10}px` ;
        this.toolbar.style.maxWidth = `99%` ;

        this.componentScroll.addEventListener("wheel", e => {
            if(this.navDockedRight && this.inFullScreen) return ;
            e.preventDefault() ;
            let delta = e.deltaY || e.deltaX ;
            this.componentScroll.scrollLeft += delta ;
        }) ;

        this.colorInput.addEventListener("change", this.setColor.bind(this))
        this.addAndBtn.addEventListener("click", this.newAnd.bind(this)) ;
        this.addOrBtn.addEventListener("click", this.newOr.bind(this)) ;
        this.addNotBtn.addEventListener("click", this.newNot.bind(this)) ;
        this.addRomBtn.addEventListener("click", this.newRom.bind(this)) ;
        this.add7SegBtn.addEventListener("click", this.new7Seg.bind(this)) ;
        this.addInputBtn.addEventListener("click", this.newInput.bind(this)) ;
        this.addOutputBtn.addEventListener("click", this.newOutput.bind(this)) ;
        this.clearBtn.addEventListener("click", this.clearCanvas.bind(this)) ;
        this.truthBtn.addEventListener("click", this.genTruthTable.bind(this)) ;

        document.addEventListener("click", this.removeContextMenu.bind(this)) ;
    }

    generateToolbar() {
        let nav = document.createElement("nav") ;
        nav.id = 'fun-with-logic-gates--nav' ;
        nav.innerHTML = `<div id="components--div">` +
            `<input id='add-item--color-input' type='color' value='${this.color}'/>` +
            "<button id='add-and--button'>AND</button>" +
            "<button id='add-or--button'>OR</button>" +
            "<button id='add-not--button'>NOT</button>" +
            "<button id='add-rom--button'>ROM</button>" +
            "<button id='add-seven-seg--button'>7SEG</button>" +
            "<span id='new-components--span'></span>" +
            "</div><div id='other-controls--div'>" +
            "<button id='add-input--button'>Add Input</button>" +
            "<input type='text' maxlength='5' id='add-input--input' placeholder='Input Label' value='IN' onkeyup='this.value = this.value.toUpperCase();'/>" +
            "<button id='add-output--button'>Add Output</button>" +
            "<input type='text' maxlength='5' id='add-output--input' placeholder='Output Label' value='OUT' onkeyup='this.value = this.value.toUpperCase();'/>" +
            "<button id='truth-table--button'>Truth Table</button>" +
            "<button id='clear-state--button'>Clear</button>" +
            "<button id='save-component--button'>Save</button>" +
            "<button id='full-screen--button'>Full Screen</button></div>" ;
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
        let touch = e.pointerType === "touch" ;
        let { x, y } = this.component.getDocumentOffset(e) ;
        e.preventDefault() ;
        this.removeContextMenu() ;

        let node = document.createElement("menu") ;
        node.id = 'context-menu' ;
        if(touch) node.classList.add('touch-menu') ;
        node.innerHTML = `<li><button data-name="${name}" id="context-menu--edit">Edit</button></li>` +
            `<li><button data-name="${name}" id="context-menu--duplicate">Duplicate</button></li>` +
            `<li><button data-name="${name}" id="context-menu--delete">Delete</button></li>` ;

        if(touch) {
            node.innerHTML += `<li><button data-name="${name}" id="context-menu--cancel">Cancel</button></li>` ;
        }

        this.component.placeholder.appendChild(node) ;

        let removeComponent = document.getElementById('context-menu--delete') ;
        removeComponent.addEventListener("click", this.removeComponent.bind(this)) ;

        let duplicateComponent = document.getElementById('context-menu--duplicate') ;
        duplicateComponent.addEventListener("click", this.duplicateComponent.bind(this)) ;

        let editComponent = document.getElementById('context-menu--edit') ;
        editComponent.addEventListener("click", this.editComponent.bind(this)) ;

        let cancel = document.getElementById('context-menu--cancel') ;
        if(cancel) cancel.addEventListener("click", this.removeContextMenu.bind(this)) ;

        let menu = document.getElementById('context-menu') ;
        if(!touch) {
            menu.style.top = `${y - 30 - menu.clientHeight}px`;
            menu.style.left = `${x - 55}px`;
        }
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

    async newRom() {
        let lookUpTable = await this.promptForLookUpTable() ;

        if(lookUpTable)
            this.component.newRom(lookUpTable) ;
    }

    new7Seg() {
        this.component.newItem(Component.types.SEVENSEG) ;
    }

    newCustom(name, componentSpec) {
        let type = AbstractedComponent.determineType(name, componentSpec)
        this.component.newItem(type, name, componentSpec) ;
    }

    promptForLookUpTable() {
        let mask = document.createElement("div") ;
        let lutDiv = document.createElement("div") ;
        mask.id = "canvas-mask--div" ;
        lutDiv.id = "look-up-table--div" ;

        let insertRows = (elem, bits) => {
            elem.innerHTML = "" ;
            for(let i = 0; i < Math.pow(2, bits); i++) {
                let binary = (i >>> 0).toString(2).padStart(bits, '0') ;
                let tr = document.createElement("tr") ;
                tr.id = `look-up-table--values-${i}` ;
                tr.innerHTML = `<td class="input--td">${binary}</td><td class="output--td" contenteditable="true">00000000</td>` ;
                elem.append(tr) ;
            }
        }

        let extractRows = (elem, bits) => {
            let lookUpTable = { values: {} }
            for(let i = 0; i < Math.pow(2, bits); i++) {
                let inputs = document.querySelector(`#look-up-table--div #look-up-table--values-${i} .input--td`) ;
                let outputs = document.querySelector(`#look-up-table--div #look-up-table--values-${i} .output--td`) ;

                lookUpTable.values[inputs.innerText] = outputs.innerText ;
            }
            lookUpTable.numIn = parseInt(bits) ;
            lookUpTable.numOut = 8 ;

            lookUpTable.inLabels = (lookUpTable.numIn === 2 ? "01" : "0123").split("") ;
            lookUpTable.outLabels = "01234567".split("") ;

            return lookUpTable ;
        }

        lutDiv.innerHTML = `<span class="look-up-table-close--span">&#10006;</span><div>`+
            `<div id="look-up-table-scroll--div"><table id="look-up-table--table">` +
            `<thead><tr id="look-up-table--labels-row">` +
            `<th>INPUT</th><th>OUTPUT</th>` +
            `</tr></thead><tbody id="look-up-table--tbody">` +
            `</tbody></table></div>` +
            `<input type="text" id="look-up-table-name--input" class="look-up-table--input" placeholder="Name" ` +
                `maxlength="10" onkeyup='this.value = this.value.toUpperCase();'/>` +
            `<select class="look-up-table--select"><option value="2">2-bit</option><option value="4">4-bit</option></select>` +
            `<button id="look-up-table--button">Create ROM</button></div>` ;

        this.component.placeholder.appendChild(mask) ;
        this.component.placeholder.appendChild(lutDiv) ;

        let tbody = document.getElementById("look-up-table--tbody") ;

        insertRows(tbody, 2) ;

        return new Promise((resolve) => {
            let save = document.querySelector(`#look-up-table--div #look-up-table--button`) ;
            let close  = document.querySelector(`#look-up-table--div .look-up-table-close--span`) ;
            let select  = document.querySelector(`#look-up-table--div .look-up-table--select`) ;

            select.addEventListener("change", (e) => {
                let bits = e.currentTarget.value ;
                insertRows(tbody, parseInt(bits)) ;
            }) ;
            save.addEventListener("click", () => {
                let name  = document.querySelector(`#look-up-table--div #look-up-table-name--input`) ;
                let select  = document.querySelector(`#look-up-table--div .look-up-table--select`) ;
                let lookUpTable = extractRows(tbody, parseInt(select.value)) ;
                lookUpTable.name = name.value ;

                if(!lookUpTable.name) {
                    new ToastMessage("Name is required.", ToastMessage.ERROR).show() ;
                    return ;
                }

                for(let i in lookUpTable.values) {
                    if (lookUpTable.values[i].length !== 8) {
                        new ToastMessage("Output value must contain 8 values.", ToastMessage.ERROR).show();
                        return;
                    }
                    if (lookUpTable.values[i].match(/[^0,1]/)) {
                        new ToastMessage("Only zeros and ones may be entered.", ToastMessage.ERROR).show();
                        return;
                    }
                }

                this.component.placeholder.removeChild(mask) ;
                this.component.placeholder.removeChild(lutDiv) ;
                resolve(lookUpTable) ;
            }) ;
            close.addEventListener("click", () => {
                this.component.placeholder.removeChild(mask) ;
                this.component.placeholder.removeChild(lutDiv) ;
                resolve(false) ;
            }) ;
        }) ;
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
            color: this.color,
            navDockedRight: this.navDockedRight
        }) ;
    }

    loadToolbarState() {
        let state = this.storage.getObject() ;
        this.color = typeof state.color === "undefined" ? Component.startColor : state.color ;
        this.component.color = this.color ;
        this.navDockedRight = typeof state.navDockedRight === "undefined" ? false : state.navDockedRight ;
    }

    resetToolbar() {
        this.color = Component.startColor ;
        this.storage.setObject({}) ;
        this.toolbar.remove() ;
        this.component.canvas.after(this.generateToolbar()) ;
        this.setListeners() ;
    }
}
