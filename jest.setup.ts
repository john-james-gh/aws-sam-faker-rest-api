import { logger } from "./src/utils/logger"

if (process.env.NODE_ENV === "test") {
  logger.level = "silent"
}
