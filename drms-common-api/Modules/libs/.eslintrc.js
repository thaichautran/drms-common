module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true,
        "es2021": true,
        "jquery": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:perfectionist/recommended-natural"
    ],
    "ignorePatterns": ["**/node_modules/*"],
    "overrides": [
        {
            // enable the rule specifically for TypeScript files
            "files": ["*.ts", "*.mts", "*.cts", "*.tsx"],
            "rules": {
                "@typescript-eslint/explicit-function-return-type": [
                    "error",
                    {
                        "allowExpressions": true
                    }
                ]
            }
        },
        {
            "env": {
                "node": true
            },
            "files": [
                ".eslintrc.{js,cjs}"
            ],
            "parserOptions": {
                "sourceType": "script"
            }
        }
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint",
        "perfectionist"
    ],
    "rules": {
        // disable the rule for all files
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-this-alias": [
            "warn",
            {
                "allowDestructuring": true, // Allow `const { props, state } = this`; false by default
                "allowedNames": ["self"] // Allow `const vm= this`; `[]` by default
            }
        ],
        "@typescript-eslint/no-unused-vars": ["warn"],
        "indent": [
            "error",
            4,
            {
                SwitchCase: 1,
                ignoredNodes: ["ConditionalExpression"]
            },
        ],
        "linebreak-style": [
            "off",
            "unix"
        ],
        "no-unused-vars": "off",
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ]
    }
};