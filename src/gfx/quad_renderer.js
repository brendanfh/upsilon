let between = require("../util/basic").between;
let mat4 = require("../util/mat4");

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
