module.exports = {
    between: (x, lo, hi) => x >= lo && x <= hi,
    range: function*(lo, hi, step=1) {
        while (lo <= hi) {
            yield lo;
            lo += step;
        } 
    }
}