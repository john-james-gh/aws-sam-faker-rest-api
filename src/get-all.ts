import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import pino from "pino"

const logger = pino({
  // Disable the default logging properties (pid, hostname), which overlap with AWS CloudWatch
  base: null,
  // Disable the timestamp in log messages, which overlap with AWS CloudWatch
  timestamp: false,
  formatters: {
    level(label) {
      // Return the log level named as e.g. 'info' rather than '30'
      return { level: label }
    },
  },
})

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== "GET") {
    logger.error(
      {
        httpMethod: event.httpMethod,
        path: event.path,
      },
      `invalid method`,
    )

    throw new Error(
      `handler only accepts GET method, you tried: ${event.httpMethod}`,
    )
  }

  logger.info(
    {
      path: event.path,
      httpMethod: event.httpMethod,
      headers: event.headers,
      query: event.queryStringParameters,
      body: event.body,
    },
    "received event",
  )

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: "hello everyone!",
    }),
  }

  logger.info(
    {
      path: event.path,
      statusCode: response.statusCode,
      body: JSON.parse(response.body),
    },
    "sending response",
  )

  return response
}
