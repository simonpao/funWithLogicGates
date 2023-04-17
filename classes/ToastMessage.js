class ToastMessage {
    static ERROR = 0x00 ;
    static INFO = 0x01 ;
    static offsetTop = 25 ;
    static offsetToast = 10 ;

    constructor(message, level = ToastMessage.INFO, delay = 5000) {
        this.level = level ;
        this.class = level ? "toast-message--info" : "toast-message--error" ;
        this.message = message ;
        this.delay = delay > 0 ? delay : 0 ;
        this.offset = ToastMessage.offsetTop ;
        this.top = `${ToastMessage.offsetTop}px` ;
        this.index = 0 ;
        this.placeholder = document.getElementById('new-items-placeholder') ;

        let otherToasts = document.querySelectorAll(".toast-message--span") ;
        if(otherToasts.length) {
            let max = 0 ;
            for (let t in otherToasts) if(otherToasts.hasOwnProperty(t)) {
                this.index = otherToasts[t].dataset.index >= this.index ?
                    parseInt(otherToasts[t].dataset.index) + 1 : this.index ;
                max = otherToasts[t].offsetTop > max ? t : max ;
            }
            this.offset = otherToasts[max].offsetTop + otherToasts[max].offsetHeight + ToastMessage.offsetToast ;
            this.top = `${this.offset}px` ;
        }

        this.id = `toast-message-index-${this.index}` ;
    }

    show() {
        const toast = document.createElement("span") ;
        toast.className = `toast-message--span ${this.class}` ;
        toast.id = this.id ;
        toast.dataset.index = this.index ;
        toast.style.top = this.top ;
        toast.innerHTML = `${this.message}<span class="toast-message-close--span">&#10006;</span>` ;
        this.placeholder.appendChild(toast) ;

        let timeout ;
        if(this.delay) {
            timeout = setTimeout(() => {
                this.hide() ;
            }, this.delay) ;
        }

        this.#closeListener(timeout) ;
    }

    confirm(yes = "Yes", no = "No") {
        const toast = document.createElement("span") ;
        toast.className = `toast-message--span ${this.class} toast-confirm` ;
        toast.id = this.id ;
        toast.dataset.index = this.index ;
        toast.style.top = this.top ;
        toast.innerHTML = `${this.message}<span class="toast-message-close--span">` +
            `<button class="toast-message-yes--button">${yes}</button><button class="toast-message-no--button">${no}</button></span>` ;
        this.placeholder.appendChild(toast) ;

        return new Promise((resolve) => {
            let yes = document.querySelector(`#${this.id} .toast-message-yes--button`) ;
            let no = document.querySelector(`#${this.id} .toast-message-no--button`) ;

            yes.addEventListener("click", () => {
                this.hide() ;
                resolve(true) ;
            }) ;
            no.addEventListener("click", () => {
                this.hide() ;
                resolve(false) ;
            }) ;
        }) ;
    }

    #closeListener(timeout) {
        let close = document.querySelector(`#${this.id} .toast-message-close--span`) ;
        if(close) close.addEventListener("click", () => {
            if(timeout) clearTimeout(timeout) ;
            this.hide() ;
        }) ;
    }

    hide() {
        document.getElementById(this.id).classList.add("removing-toast") ;

        setTimeout(() => {
            let element = document.getElementById(this.id) ;
            if(!element) return ;
            let elemOffsetTop = element.offsetTop ;
            let elemOffsetHeight = element.offsetHeight ;
            this.placeholder.removeChild(element) ;
            document.querySelectorAll(".toast-message--span").forEach((node) => {
                if(elemOffsetTop < node.offsetTop)
                    node.style.top = `${node.offsetTop-elemOffsetHeight-ToastMessage.offsetToast}px` ;
            }) ;
        }, 350) ;
    }
}
