let QR = require("./gfx/quad_renderer");
let Keyboard = require("./input/keyboard");

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

window.onload = (function() {
    function draw() {
        QR.clear();
        
        QR.setQuad(0, 0, 0, 160, 120, 1, 0, 1, 1);
        if (Keyboard.isDown(32)) {
            QR.draw(0, 1000);
        }
        window.requestAnimationFrame(draw);
    }
    
    return function() {
        let image = new Image();
        image.onload = function() {
            Keyboard.init();
            
            QR.init("game", { antialias: false });
            
            QR.addTexture(10, image);
            QR.useTexture(10);
            
            QR.setClearColor(0, 0, 0, 1);
            QR.setSize(320, 240);
            
            window.requestAnimationFrame(draw);
        }
        image.src = "/res/test.png";
        document.body.appendChild(image);
    };
})();
