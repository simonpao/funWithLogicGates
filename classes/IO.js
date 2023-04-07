class IO {
    constructor(id, label = "", state = 0) {
        this.id = id;
        this.label = label;
        this.state = state;
        this.x = 0 ;
        this.y = 0 ;
    }

    isAtCoordinates(x, y) {
        let r = Drawer.dim.io.r ;

        return (this.x > x - r && this.x < x + r) &&
            (this.y > y - r && this.y < y + r);
    }

    toggleState() {
        this.state = this.state === 0 ? 1 : 0 ;
    }

    toJSON() {
        return {
            id: this.id,
            label: this.label,
            state: this.state,
            x: this.x,
            y: this.y
        } ;
    }
}
