module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.routes.js',
    '!src/**/*.swagger.js',
    '!src/shared/prisma/client.js'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 60000,
  setupFilesAfterEnv: []
};