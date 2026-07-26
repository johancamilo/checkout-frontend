/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  rootDir: '.',
  moduleFileExtensions: ['js', 'json', 'vue'],
  testMatch: ['**/tests/**/*.spec.js'],
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.js$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|scss|sass)$': '<rootDir>/src/test-utils/style-mock.cjs',
  },
  setupFiles: ['<rootDir>/jest.setup.cjs'],
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.{js,vue}',
    '!src/main.js',
    '!src/router/**',
    '!**/*.config.js',
    '!src/App.vue',
    '!src/services/api.js',
    '!src/store/index.js',
    '!src/store/modules/checkout/index.js',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};
