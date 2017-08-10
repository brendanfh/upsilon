module.exports = {
    entry: "./src/main.js",
    output: {
        path: __dirname,
        filename: "bundle.js"
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', ".coffee"]
    },
    module: {
        loaders: [
            { test: /\.tsx?$/, loader: 'ts-loader' },
            { test: /\.coffee$/, loader: 'coffee-loader' }
        ]
    }
}