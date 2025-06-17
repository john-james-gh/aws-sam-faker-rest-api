import pino from "pino"
import pinoPretty from "pino-pretty"

const isLocal = Boolean(process.env.LOCAL_DDB_ENDPOINT)

export const logger = pino(
  {
    base: null, // Remove default pid/hostname from logs (CloudWatch provides this already)
    timestamp: false, // Disable automatic timestamp (CloudWatch provides timestamps already)
    formatters: {
      level(label) {
        return { level: label } // Ensure pino logs the label (e.g., 'info', 'error') instead of numeric levels (1, 2, 3, etc.)
      },
    },
  },
  // Use pino-pretty for human-readable logs in local development
  isLocal
    ? pinoPretty({
        colorize: true, // Colorize output for readability
        translateTime: "HH:MM:ss", // Show time in logs
        ignore: "pid,hostname", // Ignore pid and hostname fields
      })
    : undefined, // Use default output in production
)

// Silence logs during tests to keep test output clean
if (process.env.NODE_ENV === "test") {
  logger.level = "silent"
}
