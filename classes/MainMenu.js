class MainMenu {
    backgroundColor = "#dae0da" ;
    orientation = Coordinates.orientation.LANDSCAPE ;

    constructor(canvas, activeSession, logLvl, callbacks, options = {}) {
        this.logger = new Logger(logLvl, "MainMenu") ;
        this.activeSession = activeSession ;
        this.savesList = {} ;

        if(options.orientation)
            this.orientation = options.orientation ;

        this.listeners = {
            move: this.handleMouseMove.bind(this),
            click: this.handleMouseClick.bind(this)
        }

        this.title = {} ;
        this.title.text = "Fun with Logic Gates" ;
        this.title.subtitle = "A logic simulation by Simon Paonessa" ;
        this.canvas = canvas ;
        this.width = this.canvas.getAttribute("width") ;
        this.height = this.canvas.getAttribute("height") ;
        this.canvas2dCtx = this.canvas.getContext("2d") ;

        this.placeholder = document.getElementById('new-items-placeholder') ;

        this.buttons = {} ;
        this.buttons.continue = new Button(
            "C O N T I N U E",
            100,
            250,
            this.width - 200,
            50,
            this.width,
            "#0099FF",
            () => {
                this.removeMainMenu();
                callbacks.startFn(this.currentSave);
            }
        );
        this.buttons.start = new Button(
            "S T A R T",
            100,
            250,
            this.width - 200,
            50,
            this.width,
            "#0099FF",
            () => {
                this.removeMainMenu();
                callbacks.startFn(this.currentSave);
            }
        );
        this.buttons.new = new Button(
            "N E W",
            100,
            325,
            this.width - 200,
            50,
            this.width,
            "#99AAFF",
            async () => {
                if (!await new ToastMessage("Are you sure? All unsaved progress will be lost").confirm())
                    return;
                this.removeMainMenu();
                callbacks.newFn();
            }
        );
        this.buttons.load = new Button(
            "L O A D",
            100,
            400,
            this.width - 200,
            50,
            this.width,
            "#FF9900",
            async () => {
                let name = await this.promptForLoadName() ;
                if(!name) return ;
                this.currentSave = name ;
                this.removeMainMenu();
                if(callbacks.loadFn(name))
                    callbacks.startFn(this.currentSave);
            }
        );
        this.buttons.save = new Button(
            "S A V E",
            100,
            475,
            this.width - 200,
            50,
            this.width,
            "#0d7979",
            async () => {
                let name = await this.promptForSaveName() ;
                if(!name) return ;
                this.currentSave = name ;
                callbacks.saveFn(name) ;
            }
        );
    }

    changeCanvasDimensions(orientation) {
        this.width = this.canvas.getAttribute("width") ;
        this.height = this.canvas.getAttribute("height") ;
        this.orientation = orientation ?? Coordinates.orientation.LANDSCAPE ;
    }

    promptForSaveName() {
        let mask = document.createElement("div") ;
        let saveDiv = document.createElement("div") ;
        mask.id = "canvas-mask--div" ;
        saveDiv.id = "save-state--div" ;

        saveDiv.innerHTML = `<span class="save-state-close--span">&#10006;</span><div>`+
            `<input type="text" maxlength="10" id="save-state--input" placeholder="Save Name" value="${this.currentSave || ''}"/>`+
            `<button id="save-state--button">Save</button></div>` ;

        this.placeholder.appendChild(mask) ;
        this.placeholder.appendChild(saveDiv) ;

        return new Promise((resolve) => {
            let save = document.querySelector(`#save-state--div #save-state--button`) ;
            let close  = document.querySelector(`#save-state--div .save-state-close--span`) ;
            let nameIn = document.querySelector(`#save-state--div #save-state--input`) ;
            nameIn.select() ;
            nameIn.focus() ;
            nameIn.addEventListener("input", (e) => {
                e.currentTarget.value = e.currentTarget.value.toLowerCase().replace(/[^0-9A-Za-z]/, '') ;
            }) ;
            nameIn.addEventListener("keyup", (e) => {
                if(e.which === 13) {
                    save.dispatchEvent(new Event("click")) ;
                }
            }) ;

            save.addEventListener("click", () => {
                let finishSave = () => {
                    this.placeholder.removeChild(mask) ;
                    this.placeholder.removeChild(saveDiv) ;
                    resolve(saveName) ;
                }

                let saveName = document.querySelector(`#save-state--div #save-state--input`).value ;

                if(!saveName) {
                    new ToastMessage("Save name is required.", ToastMessage.ERROR).show() ;
                    return ;
                }

                if(Object.keys(this.savesList).includes(saveName)) {
                    new ToastMessage(`Are you sure you want to overwrite ${saveName}?`).confirm().then(confirm => {
                        if(confirm) finishSave() ;
                    }) ;
                } else {
                    finishSave() ;
                }
            }) ;
            close.addEventListener("click", () => {
                this.placeholder.removeChild(mask) ;
                this.placeholder.removeChild(saveDiv) ;
                resolve(false) ;
            }) ;
        }) ;
    }

    promptForLoadName() {
        let mask = document.createElement("div") ;
        let loadDiv = document.createElement("div") ;
        mask.id = "canvas-mask--div" ;
        loadDiv.id = "load-state--div" ;

        loadDiv.innerHTML = `<span class="load-state-close--span">&#10006;</span><div>`+
            `<div id="load-state-scroll--div"></div>` ;

        this.placeholder.appendChild(mask) ;
        this.placeholder.appendChild(loadDiv) ;

        let loadArea = document.getElementById("load-state-scroll--div") ;
        for(let name in this.savesList) {
            let loadBtn = document.createElement("button") ;
            loadBtn.className = "load-state--button" ;
            loadBtn.dataset.name = name ;
            let date = new Date(parseInt(this.savesList[name].lastUpdated)).toLocaleDateString() ;
            let time = new Date(parseInt(this.savesList[name].lastUpdated)).toLocaleTimeString() ;
            let numComp = this.savesList[name].numberOfComponents ;
            let comp = numComp === 1 ? "Component" : "Components" ;
            loadBtn.innerText = `${name} [${date} ${time} - ${numComp} ${comp} Created]` ;
            loadArea.appendChild(loadBtn) ;
        }

        if(!Object.keys(this.savesList).length) {
            loadArea.innerHTML = "<span class='load-state--error-span'>No saves to load.</span>" ;
        }

        return new Promise((resolve) => {
            let close  = document.querySelector(`#load-state--div .load-state-close--span`) ;
            let load  = document.querySelectorAll(`#load-state--div .load-state--button`) ;

            close.addEventListener("click", () => {
                this.placeholder.removeChild(mask) ;
                this.placeholder.removeChild(loadDiv) ;
                resolve(false) ;
            }) ;

            for(let i in load) if(load.hasOwnProperty(i)) {
                load[i].addEventListener("click", e => {
                    let name = e.currentTarget.dataset.name ;
                    this.placeholder.removeChild(mask) ;
                    this.placeholder.removeChild(loadDiv) ;
                    resolve(name) ;
                })
            }
        }) ;
    }

    async renderTitle() {
        let finish = () => {
            clearInterval(this.title.interval) ;
            this.canvas.removeEventListener("mouseup",  finish);
            this.canvas.removeEventListener("touchend", finish);
            while(this.title.c < this.title.chars.length) {
                this.writeTitleChar(this.title.chars[this.title.c], this.title.x, this.title.y, this.title.space) ;
                this.title.x += this.title.space ;
                this.title.c ++ ;
            }
            this.canvas2dCtx.font = "18px sans-serif";
            this.canvas2dCtx.fillStyle = "black";
            this.canvas2dCtx.fillText(this.title.subtitle, this.width/1.68, this.height-32);
            this.title.resolve() ;
        }

        return new Promise(resolve => {
            this.title.chars = this.title.text.split("") ;
            this.title.space = 40 ;
            this.title.x = 100 ;
            this.title.y = 150 ;
            this.title.c = 0 ;
            this.title.resolve = resolve ;

            this.canvas2dCtx.font = "76px Monospace";
            this.canvas2dCtx.fillStyle = "black";
            this.canvas2dCtx.fillText("_", this.title.x, this.title.y);

            this.title.interval = setInterval(() => {
                this.canvas.addEventListener("mouseup",  finish);
                this.canvas.addEventListener("touchend", finish);

                this.writeTitleChar(this.title.chars[this.title.c], this.title.x, this.title.y, this.title.space) ;
                this.title.x += this.title.space ;
                this.title.c ++ ;
                if(this.title.c === this.title.chars.length) {
                    finish() ;
                }
            }, 150) ;
        }) ;
    }

    writeTitleChar(c, x, y, s) {
        this.clearArea(x, y-10, 60, 60) ;
        this.canvas2dCtx.fillStyle = "black";
        this.canvas2dCtx.fillText(c, x, y) ;
        this.canvas2dCtx.fillText("_", x+s, y);
    }

    renderMainMenu(activeSession, savesList, currentSave) {
        this.activeSession = activeSession ;
        this.savesList = savesList ;
        this.currentSave = currentSave ;
        this.clearCanvas() ;
        this.canvas.classList.add("main-menu") ;
        this.renderTitle().then(() => {
            let buttons = this.getActiveButtons() ;
            for(let i in buttons) {
                buttons[i].render(this.canvas2dCtx) ;
            }
            setTimeout(() => {
                this.canvas.addEventListener("mousemove",  this.listeners.move);
                this.canvas.addEventListener("touchstart", this.listeners.move, { passive: false });
                this.canvas.addEventListener("click",      this.listeners.click);
            }, 10) ;
        }) ;
    }

    getActiveButtons() {
        return this.activeSession ?
            [this.buttons.continue, this.buttons.new, this.buttons.load, this.buttons.save] :
            [this.buttons.start, this.buttons.load] ;
    }

    removeMainMenu() {
        this.clearCanvas() ;
        this.canvas.classList.remove("main-menu") ;
        this.canvas.style.cursor = "grab" ;
        this.canvas.removeEventListener("mousemove",  this.listeners.move);
        this.canvas.removeEventListener("touchstart", this.listeners.move, { passive: false });
        this.canvas.removeEventListener("click",      this.listeners.click);
        this.canvas.removeEventListener("touchend",   this.listeners.touchClick, { passive: false });
    }

    clearCanvas() {
        // Blank whole canvas
        this.canvas2dCtx.fillStyle = this.backgroundColor;
        this.canvas2dCtx.fillRect(0, 0, this.width, this.height);
    }

    clearArea(x, y, w, h) {
        // Whiteout whole canvas
        this.canvas2dCtx.fillStyle = this.backgroundColor;
        this.canvas2dCtx.fillRect(x, y, w, h);
    }

    handleMouseMove(e) {
        e.preventDefault() ;
        let { x, y } = Coordinates.getCanvasOffset(e, this.width, this.height, this.canvas, this.orientation) ;
        let hovering = false ;
        let buttons = this.getActiveButtons() ;
        for(let i in buttons) {
            if(buttons[i].isAtLocation(x, y)) {
                hovering = true ;
                buttons[i].render(this.canvas2dCtx, true) ;
            } else {
                buttons[i].render(this.canvas2dCtx, false) ;
            }
        }
        if(hovering) {
            this.canvas.style.cursor = "pointer";
            this.listeners.touchClick = this.handleMouseClick.bind(this, e) ;
            this.canvas.addEventListener("touchend", this.listeners.touchClick, { passive: false });
        } else
            this.canvas.style.cursor = "default" ;
    }

    handleMouseClick(e) {
        e.preventDefault() ;
        this.canvas.removeEventListener("touchend", this.listeners.touchClick, { passive: false });
        let { x, y } = Coordinates.getCanvasOffset(e, this.width, this.height, this.canvas, this.orientation) ;
        let buttons = this.getActiveButtons() ;
        for(let i in buttons) {
            if(buttons[i].isAtLocation(x, y)) {
                this.logger.debug(`Clicked on ${i}`) ;
                buttons[i].execute() ;
                break ;
            }
        }
    }
}