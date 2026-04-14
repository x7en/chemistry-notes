module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'index.html',
    '**/*.js',
    '!**/__tests__/**',
    '!jest.config.js',
    '!node_modules/**',
    '!coverage/**'
  ],
  setupFiles: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.[cm]?js$': 'babel-jest'
  },
  coveragePathIgnorePatterns: ['/node_modules/', '/__tests__/', '/coverage/'],
  transformIgnorePatterns: [],
  coverageProvider: 'v8'
};
