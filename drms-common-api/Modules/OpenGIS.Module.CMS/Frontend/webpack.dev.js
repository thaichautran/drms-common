const common = require("./webpack.common");
const { merge } = require("webpack-merge");

module.exports = merge(common, {
    devtool: "source-map",
    mode: "development",
});