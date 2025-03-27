import pino from "pino"
import pinoPretty from "pino-pretty"

const isLocal = Boolean(process.env.LOCAL_DDB_ENDPOINT)

export const logger = pino(
  {
    base: null,
    timestamp: false,
    formatters: {
      level(label) {
        return { level: label }
      },
    },
  },
  isLocal
    ? pinoPretty({
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
      })
    : undefined,
)
