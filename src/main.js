let QR = require("./gfx/quad_renderer");

window.onload = (function() {
    return function() {
        QR.init("game", { antialias: false });
        
        QR.setClearColor(0, 0, 0, 1);
        QR.clear();
        
        let quad1 = new Quad(-.5, 0, 1, 1, 0, 0, 1, 1);
        let quad2 = new Quad(-1, 0, 1, 1, 1, 0, 1, 1);
        
        quad1.pushData(1023);
        quad2.pushData(1022);
        QR.draw(1022, 2);
    };
})();

class Quad {
    constructor(x, y, w, h, r, g, b, a) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
        this.data = new Float32Array(6*4);
        
        this.updateData();
    }
    
    updateData() {
        let x = this.x;
        let y = this.y;
        let w = this.w;
        let h = this.h;
        let r = this.r;
        let g = this.g;
        let b = this.b;
        let a = this.a;
        this.data.set([
            x,   y,   r, g, b, a,
            x,   y+h, r, g, b, a,
            x+w, y+h, r, g, b, a,
            x+w, y,   r, g, b, a,
        ]);
    }
    
    pushData(id) {
        QR.setData(id, this.data); 
    }
}