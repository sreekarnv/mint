const nodeExternals = require('webpack-node-externals');

module.exports = function (options) {
    return {
        ...options,
        watchOptions: {
            poll: 1000,
            aggregateTimeout: 300,
        },
        externals: [
            nodeExternals({
                allowlist: [/generated\/prisma/],
            }),
        ],
        resolve: {
            ...options.resolve,
            extensionAlias: {
                '.js': ['.ts', '.js'],
            },
        },
    };
};