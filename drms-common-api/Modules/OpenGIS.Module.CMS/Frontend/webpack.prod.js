const common = require("./webpack.common");
const { merge } = require("webpack-merge");
const WebpackObfuscator = require("webpack-obfuscator");

module.exports = merge(common, {
    devtool: false,
    mode: "production",
    module: {
        rules: [{
            enforce: "post",
            exclude: /node_modules/,
            test: /\.ts$/,
            use: {
                loader: WebpackObfuscator.loader,
                options: {
                    rotateStringArray: true
                }
            }
        }]
    }
});