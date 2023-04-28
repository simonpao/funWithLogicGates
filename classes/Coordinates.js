class Coordinates {
    static getCanvasOffset(e, w, canvas) {
        let { x, y } = Coordinates.getCoordinates(e) ;
        let elemRect = canvas.getBoundingClientRect();
        let left = elemRect.left, top = elemRect.top ;

        let ratio = 1 ;
        if(w > elemRect.width) {
            ratio = elemRect.width / w ;
        }

        x = (x-left)/ratio ;
        y = (y-top)/ratio ;
        return { x: x, y: y } ;
    }

    static getDocumentOffset(e) {
        let { x, y } = Coordinates.getCoordinates(e) ;

        let scrollY = window.scrollY ;
        let scrollX = window.scrollX ;

        return { x: x+scrollX, y: y+scrollY } ;
    }

    static getCoordinates(e) {
        let x = e.clientX ?? e.touches[0].clientX ;
        let y = e.clientY ?? e.touches[0].clientY ;

        return { x, y } ;
    }
}