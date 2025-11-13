
module.exports = {
    moduleDirectories: ['node_modules', 'src'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    preset: 'ts-jest',
    // Use jsdom so React components using JSX/DOM APIs can be tested.
    // Previously this was 'node' which causes Jest to try parsing JSX
    // without a DOM-like environment and leads to syntax errors.
    testEnvironment: 'jsdom',
    globals: {
        'ts-jest': {
            // Use a Jest-specific tsconfig so TSX is transformed to
            // the appropriate JSX runtime and module system for tests.
            tsconfig: '<rootDir>/tsconfig.jest.json'
        }
    },
    testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1', // Map '@/' to 'src/'
    },
};
