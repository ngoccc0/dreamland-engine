
module.exports = {
    moduleDirectories: ['node_modules', 'src'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1', // Map '@/' to 'src/'
    },
};
