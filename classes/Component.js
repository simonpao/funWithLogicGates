class Component extends ComponentInterface {
    static types = {
        RECT: 0x00,
        AND: 0x01,
        OR: 0x02,
        NOT: 0x03,
        CUSTOM: 0x04,
        XOR: 0x05,
        NOR: 0x06,
        XNOR: 0x07,
        NAND: 0x08,
        BUF: 0x09,
        SEVENSEG: 0x0a,
        ROM: 0x0b
    } ;

    static startColor = "#0099FF" ;

    touch = {} ;
    metadata = {} ;
    dragging = {} ;
    connecting = {} ;
    indices = {
        items: {},
        inputs: {},
        outputs: {},
        connections: {}
    } ;

    constructor(id, logLvl = Logger.logLvl.INFO, specs, state, removeComponentCallback, editRomCallback, options = {}) {
        super() ;
        // Whether this is being loaded for use on the canvas or an AbstractedComponentSpec
        if(id == null && logLvl == null && !!state) {
            this.constructFromState(state, specs);
            return ;
        }

        this.logger = new Logger(logLvl, "Component") ;
        this.storage = new Storage('canvas-state') ;
        this.color = Component.startColor ;
        this.specs = specs ;

        this.listeners = {} ;
        this.canvas = document.getElementById(id);
        this.metadata = {
            canvas: {
                width: this.canvas.getAttribute("width"),
                height: this.canvas.getAttribute("height"),
                orientation: options.orientation ?? Coordinates.orientation.LANDSCAPE
            }
        } ;

        this.placeholder = document.getElementById('new-items-placeholder') ;

        this.drawer = new Drawer(
            this.canvas.getContext("2d"),
            this.metadata.canvas.width,
            this.metadata.canvas.height,
            logLvl
        ) ;

        this.indices.items.index = 0 ;
        this.indices.inputs.index = 0 ;
        this.indices.outputs.index = 0 ;
        this.indices.connections.index = 0 ;

        this.removeComponentCallback = removeComponentCallback ;
        this.editRomCallback = editRomCallback ;

        this.listeners.displayCtxMenu = this.displayContextMenu.bind(this) ;
        this.listeners.mouseClick = this.mouseClick.bind(this) ;
        this.listeners.mouseClickEnd = this.mouseClickEnd.bind(this) ;
        this.listeners.touchStart = this.touchStart.bind(this) ;
        this.canvas.addEventListener("contextmenu", this.listeners.displayCtxMenu);
        this.canvas.addEventListener("mousedown", this.listeners.mouseClick);
        this.canvas.addEventListener("mouseup", this.listeners.mouseClickEnd);
        this.canvas.addEventListener("mouseout", this.listeners.mouseClickEnd);
        this.canvas.addEventListener("touchstart", this.listeners.touchStart, { passive: false });

        this.loadCanvasState(specs) ;
    }

    changeCanvasDimensions(orientation) {
        this.metadata = {
            canvas: {
                width: this.canvas.getAttribute("width"),
                height: this.canvas.getAttribute("height"),
                orientation: orientation ?? Coordinates.orientation.LANDSCAPE
            }
        } ;
    }

    removeEventListeners() {
        this.canvas.removeEventListener("contextmenu", this.listeners.displayCtxMenu);
        this.canvas.removeEventListener("mousedown", this.listeners.mouseClick);
        this.canvas.removeEventListener("mouseup", this.listeners.mouseClickEnd);
        this.canvas.removeEventListener("mouseout", this.listeners.mouseClickEnd);
        this.canvas.removeEventListener("touchstart", this.listeners.touchStart, { passive: false });
    }

    loadComponentSpec(name, spec, editing) {
        this.clearCanvasState() ;

        if(editing) {
            this.metadata.editing = name ;
            this.items = spec.items ;
            this.inputs = spec.inputs ;
            this.outputs = spec.outputs ;
            this.connections = spec.connections ;
        } else {
            let duplicate = Component.copyNewComponent(JSON.parse(JSON.stringify(spec)), this.specs) ;
            this.items = duplicate.items ;
            this.inputs = duplicate.inputs ;
            this.outputs = duplicate.outputs ;
            this.connections = duplicate.connections ;
        }

        this.indices.items.index = Object.keys(spec.items).length ;
        this.indices.inputs.index = Object.keys(spec.inputs).length ;
        this.indices.outputs.index = Object.keys(spec.outputs).length ;
        this.indices.connections.index = spec.connections.length ;

        let start = new Date().getTime() ;
        let counter = { count: 0 } ;
        this.propagateStates(this.inputs, counter) ;
        let end = new Date().getTime() ;
        let total = end-start ;
        this.logger.debug(`propagateState for component inputs took ${total.toLocaleString()}ms for ${counter.count.toLocaleString()} iterations`, counter) ;

        this.updateCanvasState() ;
    }

    async generateTruthTable() {
        let inIds = Object.keys(this.inputs) ;
        let numIn = inIds.length ;
        let outIds = Object.keys(this.outputs) ;
        let numOut = outIds.length ;
        let combinations = Math.pow(2, numIn) ;

        if(!numIn || !numOut) {
            new ToastMessage("Need at least one input and one output to generate a truth table.", ToastMessage.ERROR).show() ;
            return ;
        }

        if(numIn > 8) {
            if(!await new ToastMessage(
                `Calculating a truth table for ${combinations} input combinations could take a very long time ` +
                `and may cause your browser to hang, are you sure you want to continue?`, ToastMessage.ERROR
            ).confirm()) {
                return ;
            }
        }

        let mask = document.createElement("div") ;
        mask.id = "canvas-mask--div" ;
        this.placeholder.appendChild(mask) ;
        this.computeTruthTable(inIds, numIn, outIds, numOut, combinations).then((truthTable) => {
            this.placeholder.appendChild(truthTable) ;
            document.getElementById("truth-table-close--button").addEventListener("click", () => {
                this.placeholder.removeChild(mask) ;
                this.placeholder.removeChild(truthTable) ;
            }) ;
        }) ;
    }

    computeTruthTable(inIds, numIn, outIds, numOut, combinations) {
        return new Promise((resolve) => {
            let truthTable = document.createElement("div") ;
            truthTable.id = 'truth-table--div' ;
            let html = "<div class='truth-table-scroll--div'><table><thead><tr>" ;
            let header = "" ;

            for(let i in inIds) {
                html += `<th class="truth-table-in--th">${this.inputs[inIds[i]].label}</th>` ;
                header += ` | ${this.inputs[inIds[i]].label}` ;
            }
            for(let i in outIds) {
                html += `<th class="truth-table-out--th">${this.outputs[outIds[i]].label}</th>` ;
                header += ` | ${this.outputs[outIds[i]].label}` ;
            }
            html += "</tr></thead><tbody>" ;
            header += " |" ;
            this.logger.info(" ".padEnd(header.length, "-")) ;
            this.logger.info(header) ;
            this.logger.info(" ".padEnd(header.length, "-")) ;

            for(let i = 0; i < combinations; i++) {
                html += "<tr>" ;
                let row = "" ;
                let binary = (i >>> 0).toString(2).padStart(numIn, '0').split("") ;

                let c = 0 ;
                for(let n of binary) {
                    html += `<td class="truth-table-in--td">${n}</td>` ;
                    row += ` | ${n.padStart(this.inputs[inIds[c]].label.length)}` ;
                    this.inputs[inIds[c]].state = parseInt(n) ;
                    this.propagateState(this.inputs[inIds[c]]) ;
                    c ++ ;
                }

                for(let n = 0; n < numOut; n++) {
                    html += `<td class="truth-table-out--td">${this.outputs[outIds[n]].state}</td>` ;
                    row += ` | ${(this.outputs[outIds[n]].state).toString().padStart(this.outputs[outIds[n]].label.length)}` ;
                }
                row += " |" ;
                html += "</tr>" ;

                this.logger.info(row) ;
                this.redrawCanvas() ;
            }
            this.logger.info(" ".padEnd(header.length, "-")) ;
            html += "</tbody></table></div><button id='truth-table-close--button'>Close</button></div>" ;
            truthTable.innerHTML = html ;
            resolve(truthTable) ;
        }) ;
    }

    newRom(lookUpTable) {
        this.newItem(Component.types.ROM, lookUpTable.name, lookUpTable) ;
    }

    newItem(type, name, componentSpec) {
        let color = this.color ;
        let loc = { x: 90, y: 10 } ;
        let dim = { w: 75, h: 50 } ;

        if(type === Component.types.CUSTOM) {
            dim.w = 120 ;
            dim.h = ((Math.max(Object.keys(componentSpec.inputs).length, Object.keys(componentSpec.outputs).length)*(dim.h/2)))+10 ;
        }

        if(type === Component.types.SEVENSEG) {
            dim.w = 100;
            dim.h = 110;
        }

        if(type === Component.types.ROM) {
            dim.w = 125;
            dim.h = 175;
        }

        while(this.itemAtLocation(loc.x, loc.y) ||
              this.itemAtLocation(loc.x+dim.w, loc.y+dim.h) ||
              this.itemAtLocation(loc.x, loc.y+dim.h) ||
              this.itemAtLocation(loc.x+dim.w, loc.y)) {
            loc.y += 10;
            if(loc.y > this.metadata.canvas.height - dim.h) {
                new ToastMessage("No more room for new components. Move some items and try again.", ToastMessage.ERROR).show() ;
                this.logger.error("No more room for new components.") ;
                return ;
            }
        }

        switch(type) {
            case Component.types.RECT:
                this.indices.items.index = this.getNextAvailableIndex('rect', this.indices.items.index) ;
                this.addRectangle('rect'+this.indices.items.index, loc.x, loc.y, dim.w, dim.h, color) ;
                break ;
            case Component.types.AND:
                this.indices.items.index = this.getNextAvailableIndex('and', this.indices.items.index) ;
                this.addAndGate('and'+this.indices.items.index, loc.x, loc.y, dim.w, dim.h, color) ;
                break ;
            case Component.types.OR:
                this.indices.items.index = this.getNextAvailableIndex('or', this.indices.items.index) ;
                this.addOrGate('or'+this.indices.items.index, loc.x, loc.y, dim.w, dim.h, color) ;
                break ;
            case Component.types.NOT:
                this.indices.items.index = this.getNextAvailableIndex('not', this.indices.items.index) ;
                this.addNotGate('not'+this.indices.items.index, loc.x, loc.y, dim.w, dim.h, color) ;
                break ;
            case Component.types.CUSTOM:
            case Component.types.XOR:
            case Component.types.NOR:
            case Component.types.XNOR:
            case Component.types.NAND:
            case Component.types.BUF:
                this.indices.items.index = this.getNextAvailableIndex(name, this.indices.items.index) ;
                this.addCustom(name, type, componentSpec, this.indices.items.index, loc.x, loc.y, dim.w, dim.h, color) ;
                break ;
            case Component.types.SEVENSEG:
                this.indices.items.index = this.getNextAvailableIndex('7seg', this.indices.items.index) ;
                this.add7SegmentDisplay('7seg'+this.indices.items.index, loc.x, loc.y) ;
                break ;
            case Component.types.ROM:
                this.indices.items.index = this.getNextAvailableIndex('rom', this.indices.items.index) ;
                this.addReadOnlyMemory(componentSpec, 'rom'+this.indices.items.index, loc.x, loc.y, dim.w, dim.h, color) ;
                break ;

        }

        this.indices.items.index ++ ;
        this.updateCanvasState() ;
    }

    getNextAvailableIndex(idPrefix, index) {
        while(this.itemExists(idPrefix+index)) {
            index ++ ;
        }
        return index ;
    }

    itemExists(id) {
        return typeof this.items[id] !== "undefined" ;
    }

    addRectangle(id, x, y, w, h, color) {
        if(this.itemExists(id)) {
            this.logger.error(`ID ${id} already exists.`);
            return ;
        }

        this.items[id] = new Rectangle(id, x, y, w, h, color) ;

        this.drawer.fillRectangle(x, y, w, h, color);
    }

    addAndGate(id, x, y, w, h, color) {
        if(this.itemExists(id)) {
            this.logger.error(`ID ${id} already exists.`);
            return ;
        }

        this.items[id] = new And(id, x, y, w, h, color) ;

        this.drawer.fillAnd(x, y, w, h, color);
    }

    addOrGate(id, x, y, w, h, color) {
        if(this.itemExists(id)) {
            this.logger.error(`ID ${id} already exists.`);
            return ;
        }

        this.items[id] = new Or(id, x, y, w, h, color) ;

        this.drawer.fillOr(x, y, w, h, color);
    }

    addNotGate(id, x, y, w, h, color) {
        if(this.itemExists(id)) {
            this.logger.error(`ID ${id} already exists.`);
            return ;
        }

        this.items[id] = new Not(id, x, y, w, h, color) ;

        this.drawer.fillNot(x, y, w, h, color);
    }

    add7SegmentDisplay(id, x, y) {
        if(this.itemExists(id)) {
            this.logger.error(`ID ${id} already exists.`);
            return ;
        }

        this.items[id] = new SevenSegmentDisplay(id, x, y, 100, 110) ;

        this.drawer.fillSevenSegment(x, y, this.items[id].state);
    }

    addReadOnlyMemory(lut, id, x, y, w, h, color) {
        if(this.itemExists(id)) {
            this.logger.error(`ID ${id} already exists.`);
            return ;
        }

        this.items[id] = new ReadOnlyMemory(lut, id, x, y, w, h, color) ;

        this.drawer.fillRectangularComponent(lut.name, lut.numIn, lut.inLabels, lut.numOut, lut.outLabels, x, y, w, h, color);
    }

    addCustom(name, type, componentSpec, index, x, y, w, h, color) {
        let id = name+index ;

        if(this.itemExists(id)) {
            this.logger.error(`ID ${id} already exists.`);
            return ;
        }

        this.items[id] = new AbstractedComponent(name, type, componentSpec, this.specs, id, x, y, w, h, color) ;

        this.drawer.fillCustom(name, componentSpec, x, y, w, h, color);
    }

    addInput() {
        let addInputInp = document.getElementById('add-input--input') ;
        let label = `${addInputInp.value}${this.indices.inputs.index}` ;
        let id = `IN${this.indices.inputs.index}` ;

        this.inputs[id] = new Input(id, label, 0) ;
        this.indices.inputs.index ++ ;

        this.logger.debug(this.inputs) ;

        this.drawer.fillInputs(this.inputs) ;
        this.updateCanvasState() ;
    }

    addOutput() {
        let addOutputInp = document.getElementById('add-output--input') ;
        let label = `${addOutputInp.value}${this.indices.outputs.index}` ;
        let id = `OUT${this.indices.outputs.index}` ;

        this.outputs[id] = new Output(id, label) ;
        this.indices.outputs.index ++ ;

        this.logger.debug(this.outputs) ;

        this.drawer.fillOutputs(this.outputs) ;
        this.updateCanvasState() ;
    }

    redrawItem(id) {
        if(!this.itemExists(id)) {
            this.logger.error(`ID ${id} does not exist.`) ;
            return ;
        }

        let item = this.getItem(id) ;

        switch(item.type) {
            case Component.types.RECT:
                this.drawer.fillRectangle(item.x, item.y, item.w, item.h, item.color);
                break ;
            case Component.types.AND:
                this.drawer.fillAnd(item.x, item.y, item.w, item.h, item.color);
                break ;
            case Component.types.OR:
                this.drawer.fillOr(item.x, item.y, item.w, item.h, item.color);
                break ;
            case Component.types.NOT:
                this.drawer.fillNot(item.x, item.y, item.w, item.h, item.color);
                break ;
            case Component.types.CUSTOM:
                this.drawer.fillCustom(item.name, item.spec, item.x, item.y, item.w, item.h, item.color);
                break ;
            case Component.types.XOR:
                this.drawer.fillXor(item.x, item.y, item.w, item.h, item.color);
                break ;
            case Component.types.NOR:
                this.drawer.fillNor(item.x, item.y, item.w, item.h, item.color);
                break ;
            case Component.types.XNOR:
                this.drawer.fillXnor(item.x, item.y, item.w, item.h, item.color);
                break ;
            case Component.types.NAND:
                this.drawer.fillNand(item.x, item.y, item.w, item.h, item.color);
                break ;
            case Component.types.BUF:
                this.drawer.fillBuffer(item.x, item.y, item.w, item.h, item.color);
                break ;
            case Component.types.SEVENSEG:
                this.drawer.fillSevenSegment(item.x, item.y, item.state);
                break ;
            case Component.types.ROM:
                this.drawer.fillRectangularComponent(
                    item.name,
                    item.lookUpTable.numIn,
                    item.lookUpTable.inLabels,
                    item.lookUpTable.numOut,
                    item.lookUpTable.outLabels,
                    item.x, item.y, item.w, item.h, item.color
                );
                break ;
        }
    }

    moveItem(id, x, y) {
        if(!this.itemExists(id)) {
            this.logger.error(`ID ${id} does not exist.`) ;
            return ;
        }

        this.items[id].x = x ;
        this.items[id].y = y ;
        this.items[id].updateIOLocations() ;
        this.redrawCanvas() ;
    }

    removeItem(id) {
        delete this.items[id] ;
        this.redrawCanvas() ;

        this.updateCanvasState() ;
    }

    removeInput(id) {
        delete this.inputs[id] ;
        this.drawer.fillInputs(this.inputs) ;
        this.updateCanvasState() ;
    }

    removeOutput(id) {
        delete this.outputs[id] ;
        this.drawer.fillOutputs(this.outputs) ;
        this.updateCanvasState() ;
    }

    getAllItems() {
        return this.items ;
    }

    getAllItemsExcept(id) {
        if(id === "")
            return this.getAllItems() ;
        else
            return Object.fromEntries(Object.entries(this.items)
                .filter(([key, ]) => { return key !== id }));
    }

    getInput(id) {
        return Component.getInputFromComponent(id, this) ;
    }

    static getInputFromComponent(id, obj) {
        if(typeof obj.inputs[id] !== "undefined")
            return obj.inputs[id] ;
        else {
            let ids = id.split('_') ;
            if(ids[1] === "out") return null ;
            return obj.items[ids[0]] && obj.items[ids[0]].inputs ?
                obj.items[ids[0]].inputs[ids[2]] : null ;
        }
    }

    getOutput(id) {
        return Component.getOutputFromComponent(id, this) ;
    }

    static getOutputFromComponent(id, obj) {
        if(typeof obj.outputs[id] !== "undefined")
            return obj.outputs[id] ;
        else {
            let ids = id.split('_') ;
            if(ids[1] === "in") return null ;
            return obj.items[ids[0]] && obj.items[ids[0]].outputs ?
                obj.items[ids[0]].outputs[ids[2]] : null ;
        }
    }

    getIO(id) {
        return this.getInput(id) ?? this.getOutput(id) ;
    }

    isCanvasInUse() {
        return Object.keys(this.items).length ||
            Object.keys(this.inputs).length ||
            Object.keys(this.outputs).length ||
            this.connections.length ;
    }

    somethingAtLocation(x, y, touch = false) {
        let item = this.itemAtLocation(x, y) ;
        if(item) return { type: "item", value: this.getItem(item) } ;
        let input = this.inputAtLocation(x, y, touch) ;
        if(input) return { type: "input", value: input } ;
        let output = this.outputAtLocation(x, y, touch) ;
        if(output) return { type: "output", value: output } ;
        return { type: "none", value: null } ;
    }

    itemAtLocation(x, y) {
        let items = this.getAllItems() ;
        for(let i in items) {
            if(x >= items[i].x && x <= items[i].w+items[i].x &&
                y >= items[i].y && y <= items[i].h+items[i].y) {
                return i;
            }
        }
        return false ;
    }

    detectCollisionWithWall(thisItem, newX, newY, response) {
        // Adjust x, y to keep within borders
        if(newX < Drawer.dim.io.b+2)
            response.x = Drawer.dim.io.b+2 ;

        if(newX + thisItem.w > this.metadata.canvas.width-(Drawer.dim.io.b+2))
            response.x = this.metadata.canvas.width-(Drawer.dim.io.b+2)-thisItem.w ;

        if(newY < 2)
            response.y = 2 ;

        if(newY + thisItem.h > this.metadata.canvas.height-2)
            response.y = this.metadata.canvas.height-2-thisItem.h ;

        if(newX !== response.x || newY !== response.y) {
            return 1 ;
        }

        return 0;
    }

    itemCollision(id, newX, newY) {
        let items = this.getAllItemsExcept(id) ;
        let thisItem = this.getItem(id) ;
        let response = { x: newX, y: newY } ;
        let count = 0 ;

        // Adjust x, y to keep out of other items' space
        let keys = Object.keys(items) ;
        for(let k = 0; k < keys.length; k++) {
            if(k === 0) {
                count += this.detectCollisionWithWall(thisItem, newX, newY, response);
                newX = response.x ;
                newY = response.y ;
            }

            let i = keys[k] ;
            let rectA = { x: newX, y: newY, w: thisItem.w, h: thisItem.h } ;
            let rectB = { x: items[i].x, y: items[i].y, w: items[i].w, h: items[i].h } ;

            if((Math.abs(rectA.x - rectB.x) <= (Math.abs(rectA.w + rectB.w) / 2)) &&
               (Math.abs(rectA.y - rectB.y) <= (Math.abs(rectA.h + rectB.h) / 2))) {
                response.acx = rectA.x+rectA.w/2 ;
                response.acy = rectA.y+rectA.h/2 ;
                response.bcx = rectB.x+rectB.w/2 ;
                response.bcy = rectB.y+rectB.h/2 ;
                response.dx  = response.acx - response.bcx ;
                response.dy  = response.acy - response.bcy ;
                if(Math.abs(response.dx) > Math.abs(response.dy)) {
                    if(response.dx > 0)
                        response.x = rectB.x + rectB.w + 1 ;
                    else
                        response.x = rectB.x - rectA.w - 1 ;
                } else {
                    if(response.dy > 0)
                        response.y = rectB.y + rectB.h + 1 ;
                    else
                        response.y = rectB.y - rectA.h - 1 ;
                }
                if(newX !== response.x || newY !== response.y) {
                    k = -1 ;
                    count++ ;
                    newX = response.x ;
                    newY = response.y ;
                }
                if(count > 1)
                    break ;
                this.logger.debug(`itemCollision(): ${JSON.stringify({response, ...{ count }})}`) ;
            }
        }

        if(count > 1)
            return { x: false, y: false } ;
        return response ;
    }

    inputAtLocation(x, y, touch = false) {
        for(let i in this.inputs) {
            if(this.inputs[i].isAtCoordinates(x, y, touch))
                return this.inputs[i] ;
        }
        for(let i in this.items) {
            for(let j in this.items[i].inputs)
                if(this.items[i].inputs[j].isAtCoordinates(x, y))
                    return this.items[i].inputs[j] ;
        }
        return false ;
    }

    outputAtLocation(x, y, touch = false) {
        for(let i in this.outputs) {
            if(this.outputs[i].isAtCoordinates(x, y, touch))
                return this.outputs[i] ;
        }
        for(let i in this.items) {
            for(let j in this.items[i].outputs)
                if(this.items[i].outputs[j].isAtCoordinates(x, y))
                    return this.items[i].outputs[j] ;
        }
        return false ;
    }

    parseInput(e, touch = false) {
        let { x, y } = this.getCanvasOffset(e) ;

        if(this.connecting.isConnecting) {
            this.endIOConnect(x, y, touch) ;
            return;
        }

        let input = this.inputAtLocation(x, y, touch) ;
        let output = this.outputAtLocation(x,y, touch) ;
        if(input || output) {
            let type = input ? "input" : "output";
            let io = input ? input : output;
            this.logger.debug(`${type} ${io.id} at location ${x}, ${y}`);

            if (typeof e.getModifierState === "function" &&
                e.getModifierState("Shift") &&
                !this.connecting.isConnecting) {
                this.startIOConnect(e, io.id, type);
            } else {
                if(type === "output" || typeof this.inputs[io.id] === "undefined") return ;
                this.inputs[io.id].toggleState() ;

                let start = new Date().getTime() ;
                let counter = { count: 0 } ;
                this.propagateState(this.inputs[io.id], counter) ;
                let end = new Date().getTime() ;
                let total = end-start ;
                this.logger.debug(`propagateState for ${io.id} took ${total.toLocaleString()}ms for ${counter.count.toLocaleString()} iterations`, counter) ;

                this.drawer.fillInputs(this.inputs) ;
                this.updateCanvasState() ;
            }
            return ;
        }

        let i = this.itemAtLocation(x, y) ;
        if(i !== false && !touch) {
            this.dragStart(i, x, y);
        }
    }

    mouseClick(e) {
        this.removeContextMenu() ;
        switch (e.which) {
            case 1: // Left Mouse button pressed.
                this.parseInput(e) ;
                break;
            case 2: // Middle Mouse button pressed.
                break;
            case 3: // Right Mouse button pressed.
                break;
        }
    }

    mouseClickEnd(e) {
        switch (e.which) {
            case 1: // Left Mouse button pressed.
                if(this.dragging.id)
                    this.dragEnd();
                break;
            case 2: // Middle Mouse button pressed.
                break;
            case 3: // Right Mouse button pressed.
                break;
        }
    }

    touchStart(e) {
        if(e.touches.length > 1) return ;
        this.removeContextMenu() ;
        e.preventDefault() ;
        if(this.dragging.id)
            this.dragEnd() ;

        //let { x, y } = this.getCanvasOffset(e) ;
        //this.drawer.test(x, y, "red") ;

        this.touch.callbackEnd = this.touchEndCallback.bind(this, e) ;
        this.touch.callbackMove = this.touchMoveCallback.bind(this, e) ;
        this.touch.callbackCancel = this.touchCancelCallback.bind(this) ;

        this.canvas.addEventListener("touchend",    this.touch.callbackEnd) ;
        this.canvas.addEventListener("touchmove",   this.touch.callbackMove) ;
        this.canvas.addEventListener("touchcancel", this.touch.callbackCancel) ;
    }

    removeTouchEventListeners() {
        this.canvas.removeEventListener("touchend",    this.touch.callbackEnd) ;
        this.canvas.removeEventListener("touchmove",   this.touch.callbackMove) ;
        this.canvas.removeEventListener("touchcancel", this.touch.callbackCancel) ;
    }

    touchEndCallback(tse, e) {
        let { x, y } = this.getCanvasOffset(e) ;
        let s = this.somethingAtLocation(x, y, true) ;

        if(this.dragging.id)
            this.dragEnd();

        if(s.type === "none" && this.connecting.isConnecting) {
            this.addConnectionAnchorPoint(x, y) ;
            this.connect(e) ;
        }

        let input = this.inputAtLocation(x+50, y, true) ;
        if(input && typeof this.inputs[input.id] !== "undefined") {
            this.inputs[input.id].toggleState() ;
            this.propagateState(this.inputs[input.id]) ;
            this.drawer.fillInputs(this.inputs) ;
            this.updateCanvasState() ;
        } else {
            let menu = document.getElementById("context-menu") ;
            if(!menu) this.displayContextMenu(tse, true) ;
        }

        this.removeTouchEventListeners() ;
    }

    touchMoveCallback(tse, e) {
        let { x, y } = this.getCanvasOffset(tse) ;
        let i = this.itemAtLocation(x, y) ;
        let moveTo = this.getCanvasOffset(e) ;

        if(i !== false) {
            let { deltaX, deltaY } = this.determineDeltaXY(x, y, moveTo.x, moveTo.y) ;
            if(deltaX < 15 && deltaY < 15) return ;

            this.removeTouchEventListeners() ;
            this.dragStart(i, x, y, true);
        }
    }

    determineDeltaXY(x, y, dx, dy) {
        let deltaX = Math.abs(dx - x) ;
        let deltaY = Math.abs(dy - y) ;

        this.logger.debug(`determineDeltaXY: x: ${deltaX}, y: ${deltaY}`) ;

        return { deltaX, deltaY } ;
    }

    touchCancelCallback() {
        if(this.dragging.id)
            this.dragEnd();
        this.removeTouchEventListeners() ;
    }

    displayContextMenu(e, touch = false) {
        if(this.connecting.isConnecting && !touch) {
            e.preventDefault() ;
            this.cancelIOConnect();
            return;
        }

        let absPos = this.getDocumentOffset(e) ;
        let { x, y } = this.getCanvasOffset(e) ;

        let menuItems = 0 ;
        let menu = document.createElement("menu") ;
        menu.id = 'context-menu' ;
        if(touch) menu.classList.add('touch-menu') ;
        let html = "" ;

        let something = this.somethingAtLocation(x, y, touch) ;

        if(something.type === "item") {
            menuItems ++ ;
            html += `<li><button data-id="${something.value.id}" data-type="item" id="context-menu--paint">Paint</button></li>` ;
            if(something.value.type === Component.types.ROM) {
                menuItems ++ ;
                html += `<li><button data-id="${something.value.id}" data-type="item" id="context-menu--edit-rom">Edit</button></li>` ;
            }
            menuItems ++ ;
            html += `<li><button data-id="${something.value.id}" data-type="item" id="context-menu--disconnect">Disconnect</button></li>` ;
            menuItems ++ ;
            html += `<li><button data-id="${something.value.id}" data-type="item" id="context-menu--remove">Remove</button></li>` ;
            if(touch) {
                if(this.connecting.isConnecting) {
                    let to = this.connecting.connectTo;
                    for (let io of something.value[`${to}s`]) {
                        menuItems++;
                        html += `<li><button data-id="${io.id}" data-type="item" class="context-menu--connect-to">Connect to ${io.label || io.id.split("_")[2]}</button></li>`;
                    }
                } else {
                    for (let io of something.value[`inputs`]) {
                        menuItems++;
                        html += `<li><button data-id="${io.id}" data-type="input" class="context-menu--connect">Connect from ${io.label || io.id.split("_")[2]}</button></li>`;
                    }
                }
            }
        }
        if(something.type === "input") {
            if(!touch || !this.connecting.isConnecting) {
                menuItems++;
                html += `<li><button data-id="${something.value.id}" data-type="input" id="context-menu--connect">Connect</button></li>`;
            }
            menuItems ++ ;
            html += `<li><button data-id="${something.value.id}" data-type="input" id="context-menu--disconnect">Disconnect</button></li>` ;
            menuItems ++ ;
            html += `<li><button data-id="${something.value.id}" data-type="input" id="context-menu--rename">Rename</button></li>` ;
            menuItems ++ ;
            html += `<li><button data-id="${something.value.id}" data-type="input" id="context-menu--remove">Remove</button></li>` ;
            if(touch) {
                if(this.connecting.isConnecting && this.connecting.connectTo === "input") {
                    menuItems ++ ;
                    html += `<li><button data-id="${something.value.id}" data-type="input" class="context-menu--connect-to">Connect to ${something.value.label || something.value.id}</button></li>` ;
                }
                menuItems ++ ;
                html = `<li><button data-id="${something.value.id}" data-type="input" id="context-menu--toggle">Toggle State</button></li>` + html ;
            }
        }
        if(something.type === "output") {
            if(!touch || !this.connecting.isConnecting) {
                menuItems++;
                html += `<li><button data-id="${something.value.id}" data-type="output" id="context-menu--connect">Connect</button></li>`;
            }
            menuItems ++ ;
            html += `<li><button data-id="${something.value.id}" data-type="output" id="context-menu--disconnect">Disconnect</button></li>` ;
            menuItems ++ ;
            html += `<li><button data-id="${something.value.id}" data-type="output" id="context-menu--rename">Rename</button></li>` ;
            menuItems ++ ;
            html += `<li><button data-id="${something.value.id}" data-type="output" id="context-menu--remove">Remove</button></li>` ;
            if(touch && this.connecting.isConnecting && this.connecting.connectTo === "output") {
                menuItems ++ ;
                html += `<li><button data-id="${something.value.id}" data-type="output" class="context-menu--connect-to">Connect to ${something.value.label || something.value.id}</button></li>` ;
            }
        }

        if(touch && menuItems) {
            html += `<li><button data-id="${something.value.id}" data-type="output" id="context-menu--cancel">Cancel</button></li>` ;
        }

        menu.innerHTML = html ;
        if(menuItems) {
            e.preventDefault() ;
            this.placeholder.appendChild(menu) ;

            let toggle = document.getElementById('context-menu--toggle') ;
            if(toggle) toggle.addEventListener("click", this.contextMenuToggleInput.bind(this)) ;

            let paint = document.getElementById('context-menu--paint') ;
            if(paint) paint.addEventListener("click", this.contextMenuItemPaint.bind(this)) ;

            let editRom = document.getElementById('context-menu--edit-rom') ;
            if(editRom) editRom.addEventListener("click", this.contextMenuEditRom.bind(this)) ;

            let remove = document.getElementById('context-menu--remove') ;
            if(remove) remove.addEventListener("click", this.contextMenuObjectRemove.bind(this)) ;

            let disconnect = document.getElementById('context-menu--disconnect') ;
            if(disconnect) disconnect.addEventListener("click", this.contextMenuIODisconnect.bind(this)) ;

            let rename = document.getElementById('context-menu--rename') ;
            if(rename) rename.addEventListener("click", this.contextMenuIORename.bind(this)) ;

            let connect = document.getElementById('context-menu--connect') ;
            if(connect) connect.addEventListener("click", this.contextMenuIOConnect.bind(this)) ;

            let connects = document.getElementsByClassName('context-menu--connect') ;
            for(let i in connects)
                if(connects.hasOwnProperty(i))
                    connects[i].addEventListener("click", this.contextMenuIOConnect.bind(this)) ;

            let connectTos = document.getElementsByClassName('context-menu--connect-to') ;
            for(let i in connectTos)
                if(connectTos.hasOwnProperty(i))
                    connectTos[i].addEventListener("click", this.contextMenuIOConnectTo.bind(this)) ;

            let cancel = document.getElementById('context-menu--cancel') ;
            if(cancel) cancel.addEventListener("click", this.contextMenuCancel.bind(this)) ;

            if(!touch) {
                menu.style.top = `${absPos.y}px`;
                menu.style.left = `${absPos.x - 55}px`;
            }
        }
    }

    contextMenuCancel() {
        if(this.connecting.isConnecting)
            this.cancelIOConnect();
        this.removeContextMenu() ;
    }

    contextMenuToggleInput(e) {
        let id = e.currentTarget.dataset.id ;
        this.removeContextMenu() ;
        this.inputs[id].toggleState() ;
        this.propagateState(this.inputs[id]) ;
        this.drawer.fillInputs(this.inputs) ;
        this.updateCanvasState() ;
    }

    contextMenuItemPaint(e) {
        let id = e.currentTarget.dataset.id ;
        //let type = e.currentTarget.dataset.type ;
        this.removeContextMenu() ;
        this.getItem(id).color = this.color ;
        this.redrawCanvas() ;
        this.updateCanvasState() ;
    }

    async contextMenuEditRom(e) {
        let id = e.currentTarget.dataset.id ;
        this.removeContextMenu() ;
        let rom = this.getItem(id) ;
        let lookUpTable = await this.editRomCallback(rom.lookUpTable) ;
        if(lookUpTable) {
            rom.recreate(lookUpTable, id);
            this.propagateStates(this.inputs) ;
            this.updateCanvasState() ;
        }
    }

    contextMenuObjectRemove(e) {
        let id = e.currentTarget.dataset.id ;
        let type = e.currentTarget.dataset.type ;
        this.removeContextMenu() ;
        this.removeConnections(id, type) ;
        switch(type) {
            case "item":
                this.removeItem(id) ;
                break ;
            case "input":
                this.removeInput(id) ;
                break ;
            case "output":
                this.removeOutput(id) ;
                break ;
        }

        this.updateCanvasState() ;
    }

    contextMenuIOConnect(e) {
        let id = e.currentTarget.dataset.id ;
        let type = e.currentTarget.dataset.type ;
        this.removeContextMenu() ;
        this.startIOConnect(e, id, type) ;
    }

    contextMenuIOConnectTo(e) {
        let id = e.currentTarget.dataset.id ;
        this.removeContextMenu() ;
        this.establishNewConnection( this.getIO(id), this.getIO(this.connecting.start) ) ;
        this.cancelIOConnect();
        this.updateCanvasState() ;
    }

    contextMenuIODisconnect(e) {
        let id = e.currentTarget.dataset.id ;
        let type = e.currentTarget.dataset.type ;
        this.removeContextMenu() ;
        this.removeConnections(id, type) ;
    }

    contextMenuIORename(e) {
        let id = e.currentTarget.dataset.id ;
        this.renameIO(this.getIO(id)) ;
        this.removeContextMenu() ;
    }

    renameIO(io) {
        this.renamePrompt(io).then((label) => {
            if(label) {
                io.label = label ;
                this.redrawCanvas() ;
                this.updateCanvasState() ;
            }
        }) ;
    }

    renamePrompt(io) {
        let mask = document.createElement("div") ;
        let ioRename = document.createElement("div") ;
        mask.id = "canvas-mask--div" ;
        ioRename.id = "io-rename--div" ;

        ioRename.innerHTML = `<span class="io-rename-close--span">&#10006;</span><div>`+
            `<input type="text" maxlength="6" id="io-rename--input" placeholder="New Label" value="${io.label}">`+
            `<button id="io-rename--button">Rename</button></div>` ;

        this.placeholder.appendChild(mask) ;
        this.placeholder.appendChild(ioRename) ;

        return new Promise((resolve) => {
            let rename = document.querySelector(`#io-rename--div #io-rename--button`) ;
            let close  = document.querySelector(`#io-rename--div .io-rename-close--span`) ;
            let labelIn = document.querySelector(`#io-rename--div #io-rename--input`) ;
            labelIn.select() ;
            labelIn.focus() ;
            labelIn.addEventListener("input", (e) => {
                e.currentTarget.value = e.currentTarget.value.toUpperCase()
                    .replace(/[^0-9A-Za-z-+]/, "").substring(0,6) ;
            }) ;
            labelIn.addEventListener("keyup", (e) => {
                if(e.which === 13) {
                    rename.dispatchEvent(new Event("click")) ;
                }
            }) ;

            rename.addEventListener("click", () => {
                let newLabel = document.querySelector(`#io-rename--div #io-rename--input`).value ;
                if(!newLabel) {
                    new ToastMessage("Label is required.", ToastMessage.ERROR).show() ;
                    return ;
                }

                this.placeholder.removeChild(mask) ;
                this.placeholder.removeChild(ioRename) ;
                resolve(newLabel) ;
            }) ;
            close.addEventListener("click", () => {
                this.placeholder.removeChild(mask) ;
                this.placeholder.removeChild(ioRename) ;
                resolve(false) ;
            }) ;
        }) ;
    }

    removeConnections(id, type) {
        switch(type) {
            case "item":
                let item = this.getItem(id) ;
                for(let i in item.inputs) {
                    let input = item.inputs[i] ;
                    input.state = 0 ;
                    for(let c = 0; c < this.connections.length; c++) {
                        if(this.connections[c].input.id === input.id) {
                            this.connections.splice(c, 1);
                            this.indices.connections.index -- ;
                            c -- ;
                        }
                    }
                }
                for(let o in item.outputs) {
                    let output = item.outputs[o] ;
                    output.state = 0 ;
                    for(let c = 0; c < this.connections.length; c++) {
                        if(this.connections[c].output.id === output.id) {
                            this.connections.splice(c, 1);
                            this.indices.connections.index -- ;
                            c -- ;
                        }
                    }
                }
                item.determineInputState() ;
                break ;
            case "input":
                for(let c = 0; c < this.connections.length; c++) {
                    if(this.connections[c].input.id === id) {
                        this.connections[c].output.state = 0 ;
                        this.connections.splice(c, 1);
                        this.indices.connections.index -- ;
                        c -- ;
                    }
                }
                break ;
            case "output":
                for(let c = 0; c < this.connections.length; c++) {
                    if(this.connections[c].output.id === id) {
                        this.connections.splice(c, 1);
                        this.indices.connections.index -- ;
                        c -- ;
                    }
                }
                break ;
        }
        this.updateCanvasState() ;
    }

    startIOConnect(e, id, type) {
        this.canvas.style.cursor = "crosshair" ;
        this.connecting.isConnecting = true ;
        this.logger.debug(`startIOConnect() : ${id}, ${type}`) ;
        switch(type) {
            case "input":
                this.connecting.start = id ;
                this.connecting.connectFrom = "input" ;
                this.connecting.connectTo = "output" ;
                break ;
            case "output":
                this.connecting.start = id ;
                this.connecting.connectFrom = "output" ;
                this.connecting.connectTo = "input" ;
                break ;
        }
        this.connecting.anchors = [] ;
        this.logger.debug(this.connecting) ;

        this.connecting.eventFn = this.connect.bind(this) ;
        this.connecting.eventFn(e) ;
        this.canvas.addEventListener("mousemove", this.connecting.eventFn);
        this.canvas.addEventListener("touchmove", this.connecting.eventFn, { passive: false });
    }

    addConnectionAnchorPoint(x, y) {
        x = Math.round(x) ;
        y = Math.round(y) ;
        this.connecting.anchors.push({x, y}) ;
    }

    endIOConnect(x, y, touch = false) {
        let something = this.somethingAtLocation(x, y, touch) ;
        if(something.type === "none") {
            //this.cancelIOConnect();
            this.addConnectionAnchorPoint(x, y) ;
            return ;
        }

        let to = this.connecting.connectTo ;
        let from = this.connecting.connectFrom ;

        switch(something.type) {
            case "item":
                let item = something.value ;
                for( let i in item[`${to}s`] )
                    if( item[`${to}s`][i].isAtCoordinates(x, y) &&
                        from !== item[`${to}s`][i].type ) {
                        this.establishNewConnection(this.getIO(this.connecting.start), item[`${to}s`][i]) ;
                        break ;
                    }
                break ;
            case "input":
            case "output":
                if(from === something.type) {
                    this.cancelIOConnect();
                    return ;
                }
                this.establishNewConnection(something.value, this.getIO(this.connecting.start)) ;
        }

        this.cancelIOConnect();

        this.updateCanvasState() ;
    }

    establishNewConnection(i,o) {
        let con = new Connection(i, o,
            this.connecting.connectFrom === "output" ?
                this.connecting.anchors.reverse() :
                this.connecting.anchors
        ) ;
        if(this.isConnectionToOutput(con.output.id)) return ;
        this.connections.push(con) ;

        let start = new Date().getTime() ;
        let counter = { count: 0 } ;
        this.propagateState(con.input, counter) ;
        let end = new Date().getTime() ;
        let total = end-start ;
        this.logger.debug(`propagateState for connection took ${total.toLocaleString()}ms for ${counter.count.toLocaleString()} iterations`, counter) ;
    }

    cancelIOConnect() {
        this.canvas.removeEventListener("mousemove", this.connecting.eventFn);
        this.canvas.removeEventListener("touchmove", this.connecting.eventFn);
        this.canvas.style.cursor = "grab" ;
        this.connecting = {} ;
        this.redrawCanvas() ;
    }

    removeContextMenu() {
        let elem = document.getElementById('context-menu') ;
        if(elem) elem.remove() ;
    }

    dragStart(i, x, y, touch = false) {
        this.logger.debug(`dragStart(): x: ${x}; y: ${y}${i ? "; i: " + i : ""}`) ;
        if(i === false) return ;

        this.cancelIOConnect() ;
        this.canvas.style.cursor = "grabbing" ;

        let item = this.getItem(i) ;
        this.dragging.id = i ;
        this.dragging.itemX = item.x;
        this.dragging.itemY = item.y;
        this.dragging.grabX = x;
        this.dragging.grabY = y;

        this.dragging.eventFn = this.drag.bind(this) ;
        if(touch) {
            this.dragging.eventFnTouchEnd = this.dragEnd.bind(this) ;
            this.canvas.addEventListener("touchmove",   this.dragging.eventFn, { passive: false });
            this.canvas.addEventListener("touchend",    this.dragging.eventFnTouchEnd);
            this.canvas.addEventListener("touchcancel", this.dragging.eventFnTouchEnd);
        } else {
            this.canvas.addEventListener("mousemove", this.dragging.eventFn);
        }
    }

    dragEnd() {
        this.canvas.style.cursor = "grab" ;
        this.logger.debug(`dragEnd()`) ;

        delete this.dragging.id ;
        delete this.dragging.itemX ;
        delete this.dragging.itemY ;
        delete this.dragging.grabX ;
        delete this.dragging.grabY ;

        this.canvas.removeEventListener("mousemove",   this.dragging.eventFn);
        this.canvas.removeEventListener("touchmove",   this.dragging.eventFn, { passive: false });
        this.canvas.removeEventListener("touchend",    this.dragging.eventFnTouchEnd);
        this.canvas.removeEventListener("touchcancel", this.dragging.eventFnTouchEnd);

        delete this.dragging.eventFn ;
        delete this.dragging.eventFnTouchEnd ;

        this.updateCanvasState() ;
    }

    drag(e) {
        if(typeof this.dragging.id === "undefined") return ;
        e.preventDefault() ;

        let { x, y } = this.getCanvasOffset(e) ;

        let deltaX = this.dragging.grabX - x ;
        let deltaY = this.dragging.grabY - y ;

        let newX = this.dragging.itemX - deltaX ;
        let newY = this.dragging.itemY - deltaY ;

        this.logger.debug(`drag(): deltaY: ${deltaX}; deltaY: ${deltaY}; newX: ${newX}; newY: ${newY}`) ;

        let collision = this.itemCollision(this.dragging.id, newX, newY) ;
        if(collision.x && collision.y)
            this.moveItem(this.dragging.id, collision.x, collision.y);

        //this.drawer.test(collision.x, collision.y, "blue") ;
        //this.drawer.test(newX, newY) ;
    }

    connect(e) {
        let { x, y } = this.getCanvasOffset(e) ;
        if(!this.connecting.isConnecting) return ;

        let io ;
        if(this.connecting.connectFrom === "input")
            io = this.getInput(this.connecting.start) ;
        else io = this.getOutput(this.connecting.start) ;

        this.redrawCanvas() ;
        this.drawer.drawConnection(io.x, io.y, x, y, 0, this.connecting.anchors) ;
    }

    isConnectionToOutput(output) {
        for(let c in this.connections) {
            if(this.connections[c].output.id === output)
                return true ;
        }
        return false ;
    }

    getCanvasOffset(e) {
        return Coordinates.getCanvasOffset(e, this.metadata.canvas.width, this.metadata.canvas.height, this.canvas, this.metadata.canvas.orientation) ;
    }

    getDocumentOffset(e) {
        return Coordinates.getDocumentOffset(e) ;
    }

    updateCanvasState() {
        this.storage.setObject({
            items: this.items,
            inputs: this.inputs,
            outputs: this.outputs,
            connections: this.connections,
            indices: this.indices
        }) ;
        this.redrawCanvas() ;
    }

    loadCanvasState() {
        let state = this.storage.getObject() ;

        let start = new Date().getTime() ;
        this.setFromState(state) ;

        if(state.indices) {
            this.indices.items.index = state.indices.items.index;
            this.indices.inputs.index = state.indices.inputs.index;
            this.indices.outputs.index = state.indices.outputs.index;
            this.indices.connections.index = state.indices.connections.index;
        }
        let end = new Date().getTime() ;
        let total = end-start ;
        this.logger.debug(`setFromState took ${total}ms`) ;

        start = new Date().getTime() ;
        let counter = { count: 0 } ;
        this.propagateStates(this.inputs, counter) ;
        end = new Date().getTime() ;
        total = end-start ;
        this.logger.debug(`propagateState for all inputs took ${total.toLocaleString()}ms for ${counter.count.toLocaleString()} iterations`, counter) ;

        start = new Date().getTime() ;
        this.redrawCanvas() ;
        end = new Date().getTime() ;
        total = end-start ;
        this.logger.debug(`redrawCanvas for all inputs took ${total}ms`) ;
    }

    constructFromState(state, specs) {
        this.setFromState(state, specs) ;
    }

    setFromState(state, specs) {
        let newState = Component.copyNewComponent(state, specs ?? this.specs) ;

        this.items = newState.items ;
        this.inputs = newState.inputs ;
        this.outputs = newState.outputs ;
        this.connections = newState.connections ;
    }

    static copyNewComponent(state, specs) {
        let returnObject = {
            items: {},
            inputs: {},
            outputs: {},
            connections: []
        } ;

        for(let i in state.items)
            switch(state.items[i].type) {
                case Component.types.RECT:
                    returnObject.items[i] = new Rectangle(
                        state.items[i].id,
                        state.items[i].x,
                        state.items[i].y,
                        state.items[i].w,
                        state.items[i].h,
                        state.items[i].color
                    ) ;
                    break ;
                case Component.types.AND:
                    returnObject.items[i] = new And(
                        state.items[i].id,
                        state.items[i].x,
                        state.items[i].y,
                        state.items[i].w,
                        state.items[i].h,
                        state.items[i].color
                    ) ;
                    break ;
                case Component.types.OR:
                    returnObject.items[i] = new Or(
                        state.items[i].id,
                        state.items[i].x,
                        state.items[i].y,
                        state.items[i].w,
                        state.items[i].h,
                        state.items[i].color
                    ) ;
                    break ;
                case Component.types.NOT:
                    returnObject.items[i] = new Not(
                        state.items[i].id,
                        state.items[i].x,
                        state.items[i].y,
                        state.items[i].w,
                        state.items[i].h,
                        state.items[i].color
                    ) ;
                    break ;
                case Component.types.SEVENSEG:
                    returnObject.items[i] = new SevenSegmentDisplay(
                        state.items[i].id,
                        state.items[i].x,
                        state.items[i].y,
                        state.items[i].w,
                        state.items[i].h,
                        state.items[i].state
                    ) ;
                    break ;
                case Component.types.ROM:
                    returnObject.items[i] = new ReadOnlyMemory(
                        {
                            name: state.items[i].name,
                            numIn: state.items[i].lookUpTable.numIn,
                            inLabels: state.items[i].lookUpTable.inLabels,
                            numOut: state.items[i].lookUpTable.numOut,
                            outLabels: state.items[i].lookUpTable.outLabels,
                            values: state.items[i].lookUpTable.values
                        },
                        state.items[i].id,
                        state.items[i].x,
                        state.items[i].y,
                        state.items[i].w,
                        state.items[i].h,
                        state.items[i].color
                    ) ;
                    break ;
                case Component.types.CUSTOM:
                case Component.types.XOR:
                case Component.types.NOR:
                case Component.types.XNOR:
                case Component.types.NAND:
                case Component.types.BUF:
                    returnObject.items[i] = new AbstractedComponent(
                        typeof state.items[i].spec === "object" ? state.items[i].spec.name : state.items[i].spec,
                        state.items[i].type,
                        typeof state.items[i].spec === "object" ? state.items[i].spec : specs[state.items[i].spec],
                        specs,
                        state.items[i].id,
                        state.items[i].x,
                        state.items[i].y,
                        state.items[i].w,
                        state.items[i].h,
                        state.items[i].color
                    ) ;
                    break ;
            }
        for(let i in state.inputs)
            returnObject.inputs[i] = new Input(
                state.inputs[i].id,
                state.inputs[i].label,
                state.inputs[i].state
            ) ;
        for(let i in state.outputs)
            returnObject.outputs[i] = new Output(
                state.outputs[i].id,
                state.outputs[i].label,
                state.outputs[i].state
            ) ;
        for(let i in state.connections)
            returnObject.connections[i] = Connection.fromIds(
                returnObject,
                typeof state.connections[i].input === "object" ? state.connections[i].input.id : state.connections[i].input,
                typeof state.connections[i].output === "object" ? state.connections[i].output.id : state.connections[i].output,
                state.connections[i].anchors
            ) ;

        return returnObject ;
    }

    redrawCanvas() {
        this.drawer.clearCanvas() ;

        for(let i in this.items) {
            this.redrawItem(i) ;
        }

        this.drawer.fillInputs(this.inputs) ;
        this.drawer.fillOutputs(this.outputs) ;

        for(let i in this.connections) {
            let cx = this.connections[i] ;
            this.drawer.drawConnection(cx.input.x, cx.input.y, cx.output.x, cx.output.y, cx.state, cx.anchors) ;
        }
    }

    clearCanvasState() {
        if(this.metadata.editing) {
            if(!this.removeComponentCallback(this.metadata.editing))
                return ;
        }

        this.drawer.clearCanvas() ;

        this.metadata.editing = false ;
        this.items = {} ;
        this.inputs = {} ;
        this.outputs = {} ;
        this.connections = [] ;
        this.indices.items.index = 0 ;
        this.indices.inputs.index = 0 ;
        this.indices.outputs.index = 0 ;
        this.indices.connections.index = 0 ;
        this.storage.setObject({}) ;
    }
}
