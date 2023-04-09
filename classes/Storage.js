class Storage {
    constructor(key) {
        this.key = key ;
    }

    getObject() {
        try {
            let value = localStorage.getItem( `fun-with-logic-gates--${this.key}` );
            let object = JSON.parse( value );
            return object || {} ;
        } catch ( e ) {
            console.error(e) ;
            return {} ;
        }
    }

    setObject(object) {
        try {
            let value = JSON.stringify(object) ;
            localStorage.setItem( `fun-with-logic-gates--${this.key}`, value ) ;
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
