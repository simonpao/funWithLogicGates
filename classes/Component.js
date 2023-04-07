class Component {
    static types = {
        RECT: 0x00,
        AND: 0x01,
        OR: 0x02,
        NOT: 0x03,
        CUSTOM: 0x04
    } ;

    static startColor = "#0099FF" ;

    metadata = {} ;
    items = {} ;
    dragging = {} ;
    connecting = {} ;
    propagating = [] ;
    inputs = {} ;
    outputs = {} ;
    connections = [] ;
    indices = {
        items: {},
        inputs: {},
        outputs: {},
        connections: {}
    } ;

    constructor(id, logLvl = Logger.logLvl.INFO, specs, state) {
        // Whether this is being loaded for use on the canvas or an AbstractedComponentSpec
        if(id == null && logLvl == null && !!state) {
            this.constructFromState(state, specs);
            return ;
        }

        this.logger = new Logger(logLvl, "Component") ;
        this.storage = new Storage('canvas-state') ;
        this.color = Component.startColor ;

        this.canvas = document.getElementById(id);
        this.metadata = {
            canvas: {
                width: this.canvas.getAttribute("width"),
                height: this.canvas.getAttribute("height")
            }
        } ;
        this.canvas.classList.add("fun-with-logic-gates--canvas") ;

        this.placeholder = document.createElement("div") ;
        this.placeholder.id = 'new-items-placeholder' ;
        this.canvas.after(this.placeholder) ;

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

        this.canvas.addEventListener("contextmenu", this.displayContextMenu.bind(this));
        this.canvas.addEventListener("mousedown", this.mouseClick.bind(this));
        this.canvas.addEventListener("mouseup", this.mouseClickEnd.bind(this));
        this.canvas.addEventListener("mouseout", this.mouseClickEnd.bind(this));
        this.canvas.addEventListener("touchstart", this.touchStart.bind(this));
        this.canvas.addEventListener("touchend", this.touchEnd.bind(this));
        this.canvas.addEventListener("touchcancel", this.touchEnd.bind(this));

        this.loadCanvasState(specs) ;
    }

    generateTruthTable() {
        let inIds = Object.keys(this.inputs) ;
        let numIn = inIds.length ;
        let outIds = Object.keys(this.outputs) ;
        let numOut = outIds.length ;
        let combinations = Math.pow(2, numIn) ;

        if(!numIn || !numOut) {
            new ToastMessage("Need at least one input and one output to generate a truth table.", ToastMessage.ERROR).show() ;
            return ;
        }

        let html = "<div id='canvas-mask--div'></div><div id='truth-table--div'><div class='truth-table-scroll--div'><table><thead><tr>" ;
        let header = ""
        for(let i in inIds) {
            html += `<th class="truth-table-in--th">${inIds[i]}</th>` ;
            header += ` | ${inIds[i]}` ;
        }
        for(let i in outIds) {
            html += `<th class="truth-table-out--th">${outIds[i]}</th>` ;
            header += ` | ${outIds[i]}` ;
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
                row += ` | ${n.padStart(inIds[c].length)}` ;
                this.inputs[inIds[c]].state = parseInt(n) ;
                this.propagateState(this.inputs[inIds[c]]) ;
                c ++ ;
            }

            for(let n = 0; n < numOut; n++) {
                html += `<td class="truth-table-out--td">${this.outputs[outIds[n]].state}</td>` ;
                row += ` | ${(this.outputs[outIds[n]].state).toString().padStart(outIds[n].length)}` ;
            }
            row += " |" ;
            html += "</tr>" ;

            this.logger.info(row) ;
            this.redrawCanvas() ;
        }
        this.logger.info(" ".padEnd(header.length, "-")) ;
        html += "</tbody></table></div><button id='truth-table-close--button'>Close</button></div>" ;
        this.placeholder.innerHTML = html ;
        document.getElementById("truth-table-close--button").addEventListener("click", () => {
            this.placeholder.innerHTML = "" ;
        })
    }

    newItem(type, name, componentSpec) {
        let color = this.color ;
        let loc = { x: 90, y: 10 } ;
        let dim = { w: 75, h: 50 } ;

        if(type === Component.types.CUSTOM) {
            dim.w = 120 ;
            dim.h = (Math.max(Object.keys(componentSpec.inputs).length, Object.keys(componentSpec.outputs).length)*(dim.h/2)) ;
        }

        while(this.itemAtLocation(loc.x, loc.y) ||
              this.itemAtLocation(loc.x+dim.w, loc.y+dim.h) ||
              this.itemAtLocation(loc.x, loc.y+dim.h) ||
              this.itemAtLocation(loc.x+dim.w, loc.y)) {
            loc.y += dim.h+5;
            if(loc.y > this.metadata.canvas.height - dim.h) {
                new ToastMessage("No more room for new components. Move some items and try again.", ToastMessage.ERROR).show() ;
                this.logger.error("No more room for new components.") ;
                return ;
            }
        }

        switch(type) {
            case Component.types.RECT:
                this.addRectangle('rect'+this.indices.items.index, loc.x, loc.y, dim.w, dim.h, color) ;
                break ;
            case Component.types.AND:
                this.addAndGate('and'+this.indices.items.index, loc.x, loc.y, dim.w, dim.h, color) ;
                break ;
            case Component.types.OR:
                this.addOrGate('or'+this.indices.items.index, loc.x, loc.y, dim.w, dim.h, color) ;
                break ;
            case Component.types.NOT:
                this.addNotGate('not'+this.indices.items.index, loc.x, loc.y, dim.w, dim.h, color) ;
                break ;
            case Component.types.CUSTOM:
                this.addCustom(name, componentSpec, this.indices.items.index, loc.x, loc.y, dim.w, dim.h, color) ;
                break ;
        }

        this.indices.items.index ++ ;
        this.updateCanvasState() ;
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

    addCustom(name, componentSpec, index, x, y, w, h, color) {
        let id = name+index ;

        if(this.itemExists(id)) {
            this.logger.error(`ID ${id} already exists.`);
            return ;
        }

        this.items[id] = new AbstractedComponent(name, componentSpec, id, x, y, w, h, color) ;

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

    getItem(id) {
        return this.items[id] ;
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
        if(typeof this.inputs[id] !== "undefined")
            return this.inputs[id] ;
        else {
            let ids = id.split('_') ;
            return this.getItem(ids[0]) && this.getItem(ids[0]).inputs ?
                this.getItem(ids[0]).inputs[ids[2]] : null ;
        }
    }

    getOutput(id) {
        if(typeof this.outputs[id] !== "undefined")
            return this.outputs[id] ;
        else {
            let ids = id.split('_') ;
            return this.getItem(ids[0]) && this.getItem(ids[0]).outputs ?
                this.getItem(ids[0]).outputs[ids[2]] : null ;
        }
    }

    getIO(id) {
        return this.getInput(id) ?? this.getOutput(id) ;
    }

    somethingAtLocation(x, y) {
        let item = this.itemAtLocation(x, y) ;
        if(item) return { type: "item", value: this.getItem(item) } ;
        let input = this.inputAtLocation(x, y) ;
        if(input) return { type: "input", value: input } ;
        let output = this.outputAtLocation(x, y) ;
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

    itemCollision(id, newX, newY) {
        let items = this.getAllItemsExcept(id) ;
        let thisItem = this.getItem(id) ;

        if((newX < Drawer.dim.io.b+2 || newX + thisItem.w > this.metadata.canvas.width-(Drawer.dim.io.b+2)) ||
            (newY < 2 || newY + thisItem.h > this.metadata.canvas.height-2))
            return id;

        for(let i in items) {
            if (newX < (items[i].x + items[i].w) && (newX + thisItem.w) > items[i].x &&
                newY < (items[i].y + items[i].h) && (newY + thisItem.h) > items[i].y )
                return i ;
        }
        return false ;
    }

    inputAtLocation(x, y) {
        for(let i in this.inputs) {
            if(this.inputs[i].isAtCoordinates(x, y))
                return this.inputs[i] ;
        }
        for(let i in this.items) {
            for(let j in this.items[i].inputs)
                if(this.items[i].inputs[j].isAtCoordinates(x, y))
                    return this.items[i].inputs[j] ;
        }
        return false ;
    }

    outputAtLocation(x, y) {
        for(let i in this.outputs) {
            if(this.outputs[i].isAtCoordinates(x, y))
                return this.outputs[i] ;
        }
        for(let i in this.items) {
            for(let j in this.items[i].outputs)
                if(this.items[i].outputs[j].isAtCoordinates(x, y))
                    return this.items[i].outputs[j] ;
        }
        return false ;
    }

    parseInput(e) {
        let { x, y } = this.getCanvasOffset(e) ;
        this.logger.debug(`${x}, ${y}`) ;

        if(this.connecting.isConnecting) {
            this.endIOConnect(x, y) ;
            return;
        }

        let input = this.inputAtLocation(x, y) ;
        let output = this.outputAtLocation(x,y) ;
        if(input || output) {
            let type = input ? "input" : "output";
            let io = input ? input : output;
            this.logger.debug(`${type} ${io.id} at location ${x}, ${y}`);

            if (e.getModifierState("Shift") && !this.connecting.isConnecting) {
                this.startIOConnect(e, io.id, type);
            } else {
                if(type === "output" || typeof this.inputs[io.id] === "undefined") return ;
                this.inputs[io.id].toggleState() ;
                this.propagateState(this.inputs[io.id]) ;
                this.drawer.fillInputs(this.inputs) ;
                this.updateCanvasState() ;
            }
            return ;
        }

        let i = this.itemAtLocation(x, y) ;
        if(i !== false) {
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
        e.preventDefault() ;
        this.parseInput(e) ;
    }

    touchEnd() {
        if(this.dragging.id)
            this.dragEnd();
    }

    displayContextMenu(e) {
        let absPos = this.getCoordinates(e) ;
        let { x, y } = this.getCanvasOffset(e) ;

        let menuItems = 0 ;
        let html = "<menu id='context-menu'>" ;

        let something = this.somethingAtLocation(x,y) ;

        if(something.type === "item") {
            menuItems ++ ;
            html += `<li><button data-id="${something.value.id}" data-type="item" id="context-menu--disconnect">Disconnect</button></li>` ;
            menuItems ++ ;
            html += `<li><button data-id="${something.value.id}" data-type="item" id="context-menu--remove">Remove</button></li>` ;
        }
        if(something.type === "input") {
            menuItems ++ ;
            html += `<li><button data-id="${something.value.id}" data-type="input" id="context-menu--connect">Connect</button></li>` ;
            menuItems ++ ;
            html += `<li><button data-id="${something.value.id}" data-type="input" id="context-menu--disconnect">Disconnect</button></li>` ;
            menuItems ++ ;
            html += `<li><button data-id="${something.value.id}" data-type="input" id="context-menu--rename">Rename</button></li>` ;
            menuItems ++ ;
            html += `<li><button data-id="${something.value.id}" data-type="input" id="context-menu--remove">Remove</button></li>` ;
        }
        if(something.type === "output") {
            menuItems ++ ;
            html += `<li><button data-id="${something.value.id}" data-type="output" id="context-menu--connect">Connect</button></li>` ;
            menuItems ++ ;
            html += `<li><button data-id="${something.value.id}" data-type="output" id="context-menu--disconnect">Disconnect</button></li>` ;
            menuItems ++ ;
            html += `<li><button data-id="${something.value.id}" data-type="output" id="context-menu--rename">Rename</button></li>` ;
            menuItems ++ ;
            html += `<li><button data-id="${something.value.id}" data-type="output" id="context-menu--remove">Remove</button></li>` ;
        }

        html += "</menu>" ;
        if(menuItems) {
            e.preventDefault() ;
            this.placeholder.innerHTML += html ;

            let remove = document.getElementById('context-menu--remove') ;
            if(remove) remove.addEventListener("click", this.contextMenuObjectRemove.bind(this)) ;

            let disconnect = document.getElementById('context-menu--disconnect') ;
            if(disconnect) disconnect.addEventListener("click", this.contextMenuIODisconnect.bind(this)) ;

            let rename = document.getElementById('context-menu--rename') ;
            if(rename) rename.addEventListener("click", this.contextMenuIORename.bind(this)) ;

            let connect = document.getElementById('context-menu--connect') ;
            if(connect) connect.addEventListener("click", this.contextMenuIOConnect.bind(this)) ;

            let menu = document.getElementById('context-menu') ;
            menu.style.top = `${absPos.y}px` ;
            menu.style.left = `${absPos.x-55}px` ;
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
        this.placeholder.innerHTML = `<div id="canvas-mask--div"></div><div id='io-rename--div'><span class="io-rename-close--span">&#10006;</span><div>`+
            `<input type="text" maxlength="5" id="io-rename--input" placeholder="New Label" value="${io.label}" onkeyup="this.value = this.value.toUpperCase();">`+
            `<button id="io-rename--button">Rename</button>` +
            `</div></div>` ;

        return new Promise((resolve) => {
            let rename = document.querySelector(`#io-rename--div #io-rename--button`) ;
            let close  = document.querySelector(`#io-rename--div .io-rename-close--span`) ;
            let labelIn = document.querySelector(`#io-rename--div #io-rename--input`) ;
            labelIn.select() ;
            labelIn.focus() ;

            rename.addEventListener("click", () => {
                let newLabel = document.querySelector(`#io-rename--div #io-rename--input`).value ;
                if(!newLabel) {
                    new ToastMessage("Label is required.", ToastMessage.ERROR).show() ;
                    return ;
                }

                this.placeholder.innerHTML = "" ;
                resolve(newLabel) ;
            }) ;
            close.addEventListener("click", () => {
                this.placeholder.innerHTML = "" ;
                resolve(false) ;
            }) ;
        }) ;
    }

    removeConnections(id, type) {
        switch(type) {
            case "item":
                for(let i in this.getItem(id).inputs) {
                    let input = this.getItem(id).inputs[i].id ;
                    for(let c = 0; c < this.connections.length; c++) {
                        if(this.connections[c].input.id === input) {
                            this.connections.splice(c, 1);
                            this.indices.connections.index -- ;
                            c -- ;
                        }
                    }
                }
                for(let o in this.getItem(id).outputs) {
                    let output = this.getItem(id).outputs[o].id ;
                    for(let c = 0; c < this.connections.length; c++) {
                        if(this.connections[c].output.id === output) {
                            this.connections.splice(c, 1);
                            this.indices.connections.index -- ;
                            c -- ;
                        }
                    }
                }
                break ;
            case "input":
                for(let c = 0; c < this.connections.length; c++) {
                    if(this.connections[c].input.id === id) {
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
        this.logger.debug(this.connecting) ;

        this.connecting.eventFn = this.connect.bind(this) ;
        this.connecting.eventFn(e) ;
        this.canvas.addEventListener("mousemove", this.connecting.eventFn);
        this.canvas.addEventListener("touchmove", this.connecting.eventFn);
    }

    endIOConnect(x, y) {
        let something = this.somethingAtLocation(x, y) ;
        if(something.type === "none") {
            this.cancelIOConnect();
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
        let con = new Connection(i, o) ;
        if(this.isConnectionToOutput(con.output.id)) return ;
        this.connections.push(con) ;
        this.propagateState(con.input) ;
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

    dragStart(i, x, y) {
        this.logger.debug(`dragStart(): x: ${x}; y: ${y}${i ? "; i: " + i : ""}`) ;
        if(i === false) return ;

        this.canvas.style.cursor = "grabbing" ;

        let item = this.getItem(i) ;
        this.dragging.id = i ;
        this.dragging.itemX = item.x;
        this.dragging.itemY = item.y;
        this.dragging.grabX = x;
        this.dragging.grabY = y;

        this.dragging.eventFn = this.drag.bind(this) ;
        this.canvas.addEventListener("mousemove", this.dragging.eventFn);
        this.canvas.addEventListener("touchmove", this.dragging.eventFn);
    }

    dragEnd() {
        this.canvas.style.cursor = "grab" ;
        this.logger.debug(`dragEnd()`) ;

        delete this.dragging.id ;
        delete this.dragging.itemX ;
        delete this.dragging.itemY ;
        delete this.dragging.grabX ;
        delete this.dragging.grabY ;

        this.canvas.removeEventListener("mousemove", this.dragging.eventFn);
        this.canvas.removeEventListener("touchmove", this.dragging.eventFn);

        delete this.dragging.eventFn ;

        this.updateCanvasState() ;
    }

    drag(e) {
        if(typeof this.dragging.id === "undefined") return ;

        let { x, y } = this.getCanvasOffset(e) ;

        let deltaX = this.dragging.grabX - x ;
        let deltaY = this.dragging.grabY - y ;

        let newX = this.dragging.itemX - deltaX ;
        let newY = this.dragging.itemY - deltaY ;

        this.logger.debug(`drag(): deltaY: ${deltaX}; deltaY: ${deltaY}; newX: ${newX}; newY: ${newY}`) ;
        if(!this.itemCollision(this.dragging.id, newX, newY)) {
            this.moveItem(this.dragging.id, newX, newY);
        }
    }

    connect(e) {
        let { x, y } = this.getCanvasOffset(e) ;
        if(!this.connecting.isConnecting) return ;

        let io = this.getIO(this.connecting.start) ;

        this.redrawCanvas() ;
        this.drawer.drawConnection(io.x, io.y, x, y) ;
    }

    getConnectionsByInput(input) {
        let resp = [] ;
        for(let c in this.connections) {
            if(this.connections[c].input.id === input)
                resp.push(this.connections[c]) ;
        }
        return resp ;
    }

    isConnectionToOutput(output) {
        for(let c in this.connections) {
            if(this.connections[c].output.id === output)
                return true ;
        }
        return false ;
    }

    propagateState(input) {
        let cons = this.getConnectionsByInput(input.id) ;
        if(!cons.length) return ;

        if(this.propagating.includes(input.id))
            return ;
        this.propagating.push(input.id) ;

        for(let c in cons) {
            cons[c].state = input.state ;
            cons[c].output.state = input.state ;

            let idParts = cons[c].output.id.split('_') ;
            if(idParts.length === 3) {
                let item = this.getItem(idParts[0]) ;
                item.determineInputState() ;
                for(let i in item.inputs) {
                    this.propagateState(item.inputs[i]) ;
                }
            }
        }
        this.propagating = [] ;
    }

    getCanvasOffset(e) {
        let x = e.clientX ?? e.touches[0].clientX ;
        let y = e.clientY ?? e.touches[0].clientY ;
        let elemRect = document.getElementById("canvas").getBoundingClientRect();

        return { x: x-elemRect.left, y: y-elemRect.top } ;
    }

    getAbsoluteOffset(x, y) {
        let elemRect = document.getElementById("canvas").getBoundingClientRect();

        return { x: x+elemRect.left, y: y+elemRect.top } ;
    }

    getCoordinates(e) {
        let x = e.clientX ?? e.touches[0].clientX ;
        let y = e.clientY ?? e.touches[0].clientY ;

        return { x, y } ;
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

    loadCanvasState(specs) {
        let state = this.storage.getObject() ;

        this.setFromState(state, specs) ;

        if(state.indices) {
            this.indices.items.index = state.indices.items.index;
            this.indices.inputs.index = state.indices.inputs.index;
            this.indices.outputs.index = state.indices.outputs.index;
            this.indices.connections.index = state.indices.connections.index;
        }

        for(let i in this.inputs) {
            this.propagateState(this.inputs[i]) ;
        }

        this.redrawCanvas() ;
    }

    constructFromState(state, specs) {
        this.setFromState(state, specs) ;
    }

    setFromState(state, specs) {
        for(let i in state.items)
            switch(state.items[i].type) {
                case Component.types.RECT:
                    this.items[i] = new Rectangle(
                        state.items[i].id,
                        state.items[i].x,
                        state.items[i].y,
                        state.items[i].w,
                        state.items[i].h,
                        state.items[i].color
                    ) ;
                    break ;
                case Component.types.AND:
                    this.items[i] = new And(
                        state.items[i].id,
                        state.items[i].x,
                        state.items[i].y,
                        state.items[i].w,
                        state.items[i].h,
                        state.items[i].color
                    ) ;
                    break ;
                case Component.types.OR:
                    this.items[i] = new Or(
                        state.items[i].id,
                        state.items[i].x,
                        state.items[i].y,
                        state.items[i].w,
                        state.items[i].h,
                        state.items[i].color
                    ) ;
                    break ;
                case Component.types.NOT:
                    this.items[i] = new Not(
                        state.items[i].id,
                        state.items[i].x,
                        state.items[i].y,
                        state.items[i].w,
                        state.items[i].h,
                        state.items[i].color
                    ) ;
                    break ;
                case Component.types.CUSTOM:
                    this.items[i] = new AbstractedComponent(
                        state.items[i].spec,
                        specs[state.items[i].spec],
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
            this.inputs[i] = new Input(
                state.inputs[i].id,
                state.inputs[i].label,
                state.inputs[i].state
            )
        for(let i in state.outputs)
            this.outputs[i] = new Output(
                state.outputs[i].id,
                state.outputs[i].label,
                state.outputs[i].state
            )
        for(let i in state.connections)
            this.connections[i] = Connection.fromIds(
                this,
                state.connections[i].input,
                state.connections[i].output
            )
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
            this.drawer.drawConnection(cx.input.x, cx.input.y, cx.output.x, cx.output.y, cx.state) ;
        }
    }

    clearCanvasState() {
        this.drawer.clearCanvas() ;

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
