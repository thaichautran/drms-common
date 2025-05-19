const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { merge } = require("webpack-merge");
const defaultConfig = require("../../webpack.config.js");

const Bundles = require("./webpack.bundle.js");

let entries = {}, bundles = [];

Bundles.forEach(bundle => {
    entries[bundle.chunk] = [
        path.resolve(__dirname, bundle.chunkPath)
    ];
    bundles.push(new HtmlWebpackPlugin({
        cache: true,
        chunks: [bundle.chunk],
        filename: path.resolve(__dirname, bundle.filename),
        hash: true,
        inject: false,
        minify: false,
        template: path.resolve(__dirname, bundle.template),
        title: bundle.title,
    }));
});

const paths = {
    // Production build files
    build: path.resolve(__dirname, "../Backend/wwwroot/bundles"),

    // Static files that get copied to build folder
    public: path.resolve(__dirname, "../Backend/wwwroot"),

    publicPath: "/_content/OpenGIS.Module.Core/bundles/",

    // Source files
    src: path.resolve(__dirname, "./src"),
};


module.exports = merge(defaultConfig, {
    entry: entries,

    output: {
        filename: "[name].bundle.js",
        path: path.resolve(__dirname, "../Backend/wwwroot/bundles"),
        publicPath: paths.publicPath
    },

    plugins: [].concat(bundles),

    resolve: {
        alias: {
            "@": paths.src,
            assets: paths.public,
        },
        modules: [paths.src]
    }
});
