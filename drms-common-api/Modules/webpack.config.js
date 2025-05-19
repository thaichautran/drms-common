const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ESLintPlugin = require("eslint-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

const webpack = require("webpack");

const paths = {
    // Production build files
    build: path.resolve(__dirname, "./wwwroot/bundles"),

    // Static files that get copied to build folder
    public: path.resolve(__dirname, "./wwwroot"),

    publicPath: "/_content/OpenGIS.Module.CMS/bundles/",

    // Source files
    src: path.resolve(__dirname, "./src"),
};

module.exports = {

    // cache: {
    //     type: "filesystem",
    // },

    // cache: {
    //     // cacheUnaffected: true,
    //     type: "filesystem",
    // },

    cache: false,

    entry: {},

    externals: {
        $: "jquery",
        jQuery: "jquery",
    },

    infrastructureLogging: {
        // Optional: print more verbose logging about caching
        level: "verbose"
    },

    module: {
        rules: [
            // Images: Copy image files to build folder
            { test: /\.json$/, type: "json" },

            // Images: Copy image files to build folder
            { test: /\.(?:ico|gif|png|jpg|jpeg)$/i, type: "asset/resource", },

            // Fonts and SVGs: Inline files
            { test: /\.(woff(2)?|eot|ttf|otf|svg|)$/, type: "asset/resource", },

            { test: /\.m?js$/, type: "javascript/auto", },

            {
                resolve: {
                    fullySpecified: false,
                },
                test: /\.m?js$/
            },

            // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
            { loader: "ts-loader", test: /\.tsx?$/ },

            {
                test: /\.(css)$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: "css-loader",
                        options: {
                            importLoaders: 2,
                            modules: false,
                            sourceMap: true,
                        },
                    },
                    "postcss-loader"
                ],
            },
            // CSS, PostCSS, and Sass
            {
                test: /\.(sass|scss)$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: "css-loader",
                        options: {
                            importLoaders: 2,
                            modules: false,
                            sourceMap: true,
                        },
                    },
                    "postcss-loader",
                    "sass-loader",
                ],
            }, {
                test: /\.(mustache|handlebars|hbs)$/i,
                use: [
                    {
                        loader: "raw-loader",
                        options: {
                            // esModule: false,
                        },
                    },
                ],
            }
        ],
    },

    optimization: {
        // minimize: true,
        // minimizer: [new CssMinimizerPlugin()],
        // runtimeChunk: "single",
        // splitChunks: {
        //     chunks: 'all',
        //     minSize: 20000,
        //     minRemainingSize: 0,
        //     minChunks: 1,
        //     // maxAsyncRequests: 30,
        //     maxInitialRequests: Infinity,
        //     // enforceSizeThreshold: 50000,
        //     cacheGroups: {
        //         defaultVendors: {
        //             test: /[\\/]node_modules[\\/]/,
        //             priority: -10,
        //             reuseExistingChunk: true,
        //         },
        //         default: {
        //             minChunks: 2,
        //             priority: -20,
        //             reuseExistingChunk: true,
        //         }
        //     },
        // },
        splitChunks: {
            cacheGroups: {
                styles: {
                    chunks: "all",
                    enforce: true,
                    name: "styles",
                    test: /\.css$/
                },
                vendor: {
                    name(module) {
                        const matches = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
                        if (matches && matches.length > 0) {
                            // get the name. E.g. node_modules/packageName/not/this/part.js
                            // or node_modules/packageName
                            const packageName = matches[1];

                            // npm package names are URL-safe, but some servers don't like @ symbols
                            return `npm.${packageName.replace("@", "")}`;
                        }
                    },

                    test: /[\\/]node_modules[\\/]/,
                }
            },
            chunks: "all",
            maxInitialRequests: Infinity,
            minSize: 0
        },
    },

    output: {
        assetModuleFilename: "assets/[name][ext][query]",
        filename: "[name].bundle.js",
        path: paths.build,
        publicPath: paths.publicPath
    },

    performance: {
        hints: false,
        maxAssetSize: 512000,
        maxEntrypointSize: 512000,
    },

    plugins: [
        new CleanWebpackPlugin(),
        new webpack.DefinePlugin({
            "process.platform": JSON.stringify(process.platform),
        }),
        // Extracts CSS into separate files
        new MiniCssExtractPlugin({
            chunkFilename: "styles/[id].css",
            filename: "styles/[name].bundle.css",
        }),
        // new webpack.HotModuleReplacementPlugin(),
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            process: "process",
        }),
        new ESLintPlugin({
            cache: true,
        }),
        new ForkTsCheckerWebpackPlugin()
    ],

    resolve: {
        alias: {
            "@": paths.src,
            // "@opengis/map": path.resolve(__dirname, "../../opengis-map"),
            assets: paths.public,
            handlebars: "handlebars/dist/handlebars.min.js"
        },
        extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
        modules: [paths.src, "node_modules"],
    },
};