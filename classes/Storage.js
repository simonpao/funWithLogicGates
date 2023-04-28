class Storage {
    constructor(key) {
        this.key = key ;
    }

    getObject(name) {
        let key = typeof name === "undefined" ? `fun-with-logic-gates--${this.key}` : `fun-with-logic-gates--${this.key}--${name}` ;
        try {
            let value = localStorage.getItem( key );
            let object = JSON.parse( value );
            return object || {} ;
        } catch ( e ) {
            console.error(e) ;
            return {} ;
        }
    }

    setObject(object, name) {
        let key = typeof name === "undefined" ? `fun-with-logic-gates--${this.key}` : `fun-with-logic-gates--${this.key}--${name}` ;
        try {
            let value = JSON.stringify(object) ;
            localStorage.setItem( key, value ) ;
            this.#setLastUpdated() ;
            return true ;
        } catch ( e ) {
            console.error(e) ;
            return false ;
        }
    }

    #setLastUpdated() {
        try {
            let value = new Date().getTime().toString() ;
            localStorage.setItem( `fun-with-logic-gates--last-updated`, value ) ;
        } catch ( e ) {
            console.error(e) ;
        }
    }
}
