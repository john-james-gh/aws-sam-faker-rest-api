import { describe, it, expect, beforeEach, jest, afterAll } from "@jest/globals"

// Mock pino-pretty BEFORE importing the logger module
jest.mock("pino-pretty", () => {
  return jest.fn(() => ({
    write: jest.fn(), // This simulates a writable stream.
  }))
})

describe("Logger Configuration", () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    // Clear the module cache and mocks so each test starts fresh.
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV } // reset env
  })

  afterAll(() => {
    process.env = ORIGINAL_ENV
  })

  it("should log normally when NODE_ENV is not test and LOCAL_DDB_ENDPOINT is not set", () => {
    process.env.NODE_ENV = "development"
    delete process.env.LOCAL_DDB_ENDPOINT
    // Import logger dynamically after setting the env variables.
    const { logger } = require("../src/utils/logger")
    expect(logger.level).not.toBe("silent")
  })

  it("should be silent when NODE_ENV is test", () => {
    process.env.NODE_ENV = "test"
    // Import logger dynamically after setting NODE_ENV.
    const { logger } = require("../src/utils/logger")
    expect(logger.level).toBe("silent")
  })

  it("should use pino-pretty when LOCAL_DDB_ENDPOINT is set", () => {
    process.env.LOCAL_DDB_ENDPOINT = "http://localhost:8000"

    // Re-import logger now that env is set
    const prettySpy = require("pino-pretty")
    const { logger: localLogger } = require("../src/utils/logger")

    expect(prettySpy).toHaveBeenCalledWith({
      colorize: true,
      translateTime: "HH:MM:ss",
      ignore: "pid,hostname",
    })

    expect(localLogger).toBeDefined()
  })

  it("should not use pino-pretty when LOCAL_DDB_ENDPOINT is not set", () => {
    delete process.env.LOCAL_DDB_ENDPOINT
    // We use `require()` instead of `import` here because we need to:
    // 1. Set process.env before loading the logger module (the logger reads env vars at the top level).
    // 2. Ensure our mock of `pino-pretty` is active before the module is evaluated.
    // 3. Re-evaluate the module after `jest.resetModules()` to get a fresh instance.
    // `import` is static and hoisted, so it would run before these changes take effect.
    const prettySpy = require("pino-pretty")
    require("../src/utils/logger")

    expect(prettySpy).not.toHaveBeenCalled()
  })
})
