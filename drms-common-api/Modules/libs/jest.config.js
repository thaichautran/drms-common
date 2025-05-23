module.exports = {
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    moduleNameMapper: {
        // Force module uuid to resolve with the CJS entry point, because Jest does not support package.json.exports. See https://github.com/uuidjs/uuid/issues/451
        "uuid": require.resolve("uuid"),
    },
    testEnvironment: "jsdom",
    testRegex: "/tests/.*\\.(test|spec)?\\.(ts|tsx)$",
    transform: { "^.+\\.ts?$": "ts-jest" },
    verbose: true,
};