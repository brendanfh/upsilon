let QR = require("./gfx/quad_renderer");

window.onload = (function() {
    function draw() {
        QR.clear();
        
        for (let i=0; i<1000; i++) {
            let quad = new Quad((i%25)/25, ((i/25)|0)/40, 1/50, 1/50, 1, 0, 1, 1);
            quad.pushData(i);
        }
        QR.draw(0, 1000);
        window.requestAnimationFrame(draw);
    }
    
    return function() {
        QR.init("game", { antialias: false });
        
        QR.setClearColor(0, 0, 0, 1);
        
        window.requestAnimationFrame(draw);
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