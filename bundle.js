/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

let QR = __webpack_require__(1);

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
        QR.draw(0, 1000);
        window.requestAnimationFrame(draw);
    }
    
    return function() {
        let image = new Image();
        image.onload = function() {
            QR.init("game", { antialias: false });
            
            QR.addTexture(0, image);
            QR.useTexture(0);
            
            QR.setClearColor(0, 0, 0, 1);
            QR.setSize(320, 240);
            
            window.requestAnimationFrame(draw);
        }
        image.src = "/res/test.png";
        document.body.appendChild(image);
    };
})();


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

let between = __webpack_require__(2).between;
let mat4 = __webpack_require__(3);

let QuadRenderer = (function() {
    let canvas, gl;
    
    function getGL(canvas, properties) {
        let gl = canvas.getContext("webgl", properties);
        if (gl == null) {
            gl = canvas.getContext("experimental-webgl", properties);
            if (gl == null) {
                throw "Failed to get WebGL Context";
            }
        }
        return gl;
    }
    
    function createProgram(vertexShaderCode, fragmentShaderCode) {
        let vs = compileShader(vertexShaderCode, gl.VERTEX_SHADER);
        let fs = compileShader(fragmentShaderCode, gl.FRAGMENT_SHADER);
        let program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw "Failed to link program";
        }
        return program;
    }
    
    function compileShader(source, shaderType) {
        let shader = gl.createShader(shaderType);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw "Failed to compile shader: " + gl.getShaderInfoLog(shader);
        }
        return shader;
    }
    
    const MAX_QUADS = 1024;
    const VERTICIES_PER_QUAD = 4;
    const FLOATS_PER_VERTEX = 8;
    const BYTES_PER_FLOAT = 4;
    const INDICIES_PER_QUAD = 6;
    const BYTES_PER_INDEX = 2;
    
    let program;
    let posAttrib, colAttrib, tcdAttrib;
    let viewUniform, colUniform, texUniform, worldUniform;
    
    let vbo, ibo;
    
    let viewMat, worldMat;
    
    let RENDERING_AVAILABLE = false;
    let WORLD_MATRIX_DIRTY = true;
    let VIEW_MATRIX_DIRTY = true;
    
    let textures = {};
    
    //Holds enough data for one quad
    let quadBuffer = new Float32Array(VERTICIES_PER_QUAD * FLOATS_PER_VERTEX);
    
    let Renderer = {
        init: function(canvasName, properties) {
            canvas = document.getElementById(canvasName);
            
            gl = getGL(canvas, properties);
            program = createProgram(vertexShader, fragmentShader);
            gl.useProgram(program);
            
            posAttrib = gl.getAttribLocation(program, "aPos");
            tcdAttrib = gl.getAttribLocation(program, "aTcd");
            colAttrib = gl.getAttribLocation(program, "aCol");
            colUniform = gl.getUniformLocation(program, "uCol");
            texUniform = gl.getUniformLocation(program, "uTex");
            viewUniform = gl.getUniformLocation(program, "uView");
            worldUniform = gl.getUniformLocation(program, "uWorld");
            
            this.setColor(1, 1, 1, 1);
            
            let blankVertexData = new Float32Array(MAX_QUADS*VERTICIES_PER_QUAD*FLOATS_PER_VERTEX);
            
            vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.bufferData(gl.ARRAY_BUFFER, blankVertexData, gl.DYNAMIC_DRAW);
            
            let indexData = new Uint16Array(MAX_QUADS*INDICIES_PER_QUAD);
            
            for (let i=0; i<MAX_QUADS; i++) {
                indexData[0+i*INDICIES_PER_QUAD] = 0 + i * VERTICIES_PER_QUAD;
                indexData[1+i*INDICIES_PER_QUAD] = 1 + i * VERTICIES_PER_QUAD;
                indexData[2+i*INDICIES_PER_QUAD] = 2 + i * VERTICIES_PER_QUAD;
                indexData[3+i*INDICIES_PER_QUAD] = 0 + i * VERTICIES_PER_QUAD;
                indexData[4+i*INDICIES_PER_QUAD] = 2 + i * VERTICIES_PER_QUAD;
                indexData[5+i*INDICIES_PER_QUAD] = 3 + i * VERTICIES_PER_QUAD;
            }
            
            ibo = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);
            
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            
            viewMat = mat4.identity();
            worldMat = mat4.identity();
            
            enableRendering();
        },
        
        setData: function(id, data) {
            gl.bufferSubData(gl.ARRAY_BUFFER, id * BYTES_PER_FLOAT * FLOATS_PER_VERTEX * VERTICIES_PER_QUAD, data);  
        },
        
        setQuad: function(id, x, y, w, h, r, g, b, a) {
            quadBuffer.set([
                x, y, 0, 0, r, g, b, a,
                x, y+h, 0, 1, r, g, b, a,
                x+w, y+h, 1, 1, r, g, b, a,
                x+w, y, 1, 0, r, g, b, a,
            ]);
            gl.bufferSubData(gl.ARRAY_BUFFER, id * BYTES_PER_FLOAT * FLOATS_PER_VERTEX * VERTICIES_PER_QUAD, quadBuffer);
        },
        
        clearData: function(id, count=1) {
            gl.bufferSubData(gl.ARRAY_BUFFER, id * BYTES_PER_FLOAT * FLOATS_PER_VERTEX * VERTICIES_PER_QUAD, new Float32Array(count * FLOATS_PER_VERTEX * VERTICIES_PER_QUAD));
        },
        
        clear: function() {
            gl.clear(gl.COLOR_BUFFER_BIT);  
        },
        
        draw: function(start=0, count=MAX_QUADS) {
            updateMatricies();
            gl.drawElements(gl.TRIANGLES, count * INDICIES_PER_QUAD, gl.UNSIGNED_SHORT, start * INDICIES_PER_QUAD * BYTES_PER_INDEX);
        },
        
        setClearColor: function(r, g, b, a) {
            gl.clearColor(r, g, b, a);  
        },
        
        setColor: function(r, g, b, a) {
            gl.uniform4fv(colUniform, new Float32Array([r, g, b, a]));
        },
        
        setSize: function(w, h) {
            viewMat = mat4.ortho(0, w, 0, h);
            VIEW_MATRIX_DIRTY = true;
        },
        
        addTexture: function(id, image) {
            textures[id] = setupTexture(id, image);
        },
        
        useTexture: function(id) {
            gl.uniform1i(texUniform, id);
        },
    };
    
    function enableRendering() {
        gl.useProgram(program);
        gl.enableVertexAttribArray(posAttrib);
        gl.enableVertexAttribArray(tcdAttrib);
        gl.enableVertexAttribArray(colAttrib);
        
        gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, FLOATS_PER_VERTEX*BYTES_PER_FLOAT, 0*BYTES_PER_FLOAT);
        gl.vertexAttribPointer(tcdAttrib, 2, gl.FLOAT, false, FLOATS_PER_VERTEX*BYTES_PER_FLOAT, 2*BYTES_PER_FLOAT);
        gl.vertexAttribPointer(colAttrib, 4, gl.FLOAT, false, FLOATS_PER_VERTEX*BYTES_PER_FLOAT, 4*BYTES_PER_FLOAT);
        
        RENDERING_AVAILABLE = true;
    }
    
    function disableRendering() {
        gl.disableVertexAttribArray(posAttrib);
        gl.disableVertexAttribArray(tcdAttrib);
        gl.disableVertexAttribArray(colAttrib);
        gl.useProgram(null);
        
        RENDERING_AVAILABLE = false;
    }
    
    function updateMatricies() {
        if (WORLD_MATRIX_DIRTY) {
            gl.uniformMatrix4fv(worldUniform, false, worldMat);
            WORLD_MATRIX_DIRTY = false;
        }
        if (VIEW_MATRIX_DIRTY) {
            gl.uniformMatrix4fv(viewUniform, false, viewMat);
            VIEW_MATRIX_DIRTY = false;
        }
    }
    
    function setupTexture(id, image) {
        if(!between(id, 0, 31)) {
            throw "id should be between 0 and 31 (unsigned 5-bit integer)";
        } 
        
        let tex = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        return tex;
    }
    
    let vertexShader = `
        attribute vec2 aPos;
        attribute vec2 aTcd;
        attribute vec4 aCol;
        
        varying vec4 vCol;
        varying vec2 vTcd;
        
        uniform mat4 uView;
        uniform mat4 uWorld;
        
        void main() {
            vCol = aCol;
            vTcd = aTcd;
            gl_Position = uView * uWorld * vec4(aPos, 0.0, 1.0);
        }
    `;
    
    let fragmentShader = `
        precision mediump float;
        
        varying vec4 vCol;
        varying vec2 vTcd;
        
        uniform vec4 uCol;
        uniform sampler2D uTex;
    
        void main() {
            vec4 texColor = texture2D(uTex, vTcd);
            gl_FragColor = vCol * uCol * texColor;
        }
    `;
    
    return Renderer;
})();

module.exports = QuadRenderer;


/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = {
    between: (x, lo, hi) => x >= lo && x <= hi
}

/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = {
    identity: () => {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);
    },
    
    mul: (a, b) => {
        let res = new Float32Array(16);
        
        for (let i=0, x=0, y=0; y < 4; y++) {
            for (x=0; x < 4; x++) {
                for (i=0; i < 4; i++) {
                    res[x + y * 4] += a[i + y * 4] * b[x + i * 4];
                }
            }
        }
        
        return res;
    },
    
    
    ortho: (l, r, t, b) => {
        return new Float32Array([
            (2 / (r - l)), 0, 0, 0,
            0, (2 / (t - b)), 0, 0,
            0, 0, -2, 0,
            -(r + l) / (r - l), -(t + b) / (t - b), -1, 1,
        ]);
    },
}

/***/ })
/******/ ]);