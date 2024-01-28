class Coordinates {
    static orientation = {
        LANDSCAPE: 0x00,
        PORTRAIT: 0x01
    } ;

    static getCanvasOffset(e, w, h, canvas, orientation = Coordinates.orientation.LANDSCAPE) {
        let { x, y } = Coordinates.getCoordinates(e) ;
        let { height, width, left, top } = canvas.getBoundingClientRect();

        let ratio = 1 ;
        let compare = orientation === Coordinates.orientation.LANDSCAPE ? width : height ;
        if(w > width) {
            ratio = compare / w ;
        }

        x = (x-left)/ratio ;
        y = (y-top)/ratio ;
        return orientation === Coordinates.orientation.LANDSCAPE ? { x, y } : { x: y, y: h-x } ;
    }

    static getDocumentOffset(e) {
        let { x, y } = Coordinates.getCoordinates(e) ;

        let scrollY = window.scrollY ;
        let scrollX = window.scrollX ;

        return { x: x+scrollX, y: y+scrollY } ;
    }

    static getCoordinates(e) {
        let x = e.clientX ?? (e.touches.length ? e.touches[0].clientX : e.changedTouches[0].clientX) ;
        let y = e.clientY ?? (e.touches.length ? e.touches[0].clientY : e.changedTouches[0].clientY) ;

        return { x, y } ;
    }
}