import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  ScanCommand,
  type ScanCommandInput,
} from "@aws-sdk/lib-dynamodb"
import pino from "pino"
import pinoPretty from "pino-pretty"

const isLocal = Boolean(process.env.LOCAL_DDB_ENDPOINT)
const client = new DynamoDBClient({
  endpoint: isLocal ? process.env.LOCAL_DDB_ENDPOINT : undefined,
})
const ddbDocClient = DynamoDBDocumentClient.from(client)

const logger = pino(
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

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const tableName = process.env.FAKER_TABLE

  logger.info(
    {
      tableName: process.env.FAKER_TABLE,
      ddbEndpoint: process.env.LOCAL_DDB_ENDPOINT,
    },
    "Configuration",
  )

  if (!tableName) {
    logger.error("Missing FAKER_TABLE environment variable")

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Server misconfiguration" }),
    }
  }

  if (event.httpMethod !== "GET") {
    logger.error(
      { httpMethod: event.httpMethod, path: event.path },
      "Invalid method",
    )

    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Method Not Allowed. Only GET is supported.",
      }),
    }
  }

  logger.info(
    {
      path: event.path,
      httpMethod: event.httpMethod,
      headers: event.headers,
      query: event.queryStringParameters,
    },
    "Received event",
  )

  const params: ScanCommandInput = { TableName: tableName }
  let items: Record<string, unknown>[] = []

  try {
    const data = await ddbDocClient.send(new ScanCommand(params))
    items = data.Items || []

    logger.info(
      {
        count: data.Count,
        scannedCount: data.ScannedCount,
        lastEvaluatedKey: data.LastEvaluatedKey,
        consumedCapacity: data.ConsumedCapacity,
      },
      "ScanCommand metadata",
    )
  } catch (err) {
    logger.error(
      {
        httpMethod: event.httpMethod,
        path: event.path,
        message: err instanceof Error ? err.message : String(err),
      },
      "Database query error",
    )

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Internal Server Error",
      }),
    }
  }

  const response = {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(items),
  }

  logger.info(
    { path: event.path, statusCode: response.statusCode, body: items },
    "Sending response",
  )

  return response
}
