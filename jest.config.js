/** @type {import('jest').Config} */
const config = {
    clearMocks: true,
    collectCoverage: true,
    collectCoverageFrom: ['./src/**'],
    coverageDirectory: './coverage',
    coverageReporters: ['json-summary', 'text', 'lcov'],
    moduleFileExtensions: ['js'],
    reporters: ['default'],
    testEnvironment: 'node',
    testMatch: ['**/*.test.js'],
    testPathIgnorePatterns: ['/dist/', '/node_modules/'],
    verbose: true,
};
export default config;
