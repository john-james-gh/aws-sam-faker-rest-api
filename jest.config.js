/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": "ts-jest",
  },
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  resetModules: false,
  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",
  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: "v8",
  globalSetup: "./jest.setup-env.js",
}
