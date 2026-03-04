/** @type {import('jest').Config} */
const config = {
    clearMocks: true,
    moduleFileExtensions: ['js'],
    reporters: ['default'],
    testEnvironment: 'node',
    testMatch: ['**/action-tests/**/*.act.test.js'],
    verbose: true,
};
export default config;
