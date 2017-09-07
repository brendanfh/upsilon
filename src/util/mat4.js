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