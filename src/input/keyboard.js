let range = require("../util/basic").range;

module.exports = (function() {
    let keys = (function() {
        let res = [];
        for (let _ of range(0, 256)) {
            res.push(new Uint8Array(2));
        }
        return res;
    })();
    
    let Keyboard = {
        init: function() {
            document.addEventListener("keydown", (e) => {
                keys[e.which].set([1, 2]);
            });
            document.addEventListener("keyup", (e) => {
                keys[e.which].set([0, 0]);
            });
        },
        
        isDown: function(key) {
            if (typeof key == "number") {
                return !!keys[key][0];
            } else {
                throw "unimplemented";
            }
        },
        
        isUp: function(key) {
            if (typeof key == "number") {
                return !keys[key][0];
            } else {
                throw "unimplemented";
            }
        },
        
        isJustDown: function(key) {
            if (typeof key == "number") {
                return !!keys[key][0] && keys[key][1] > 0
            } else {
                throw "unimplemented";
            } 
        },
        
        update: function() {
            for (let i=0; i<256; i++) {
                let v = keys[i][1]
                keys[i][1] = Math.max(0, v - 1);
            }
        }
    }
    
    return Keyboard;
})();