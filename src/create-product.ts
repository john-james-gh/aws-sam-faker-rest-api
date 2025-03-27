import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  PutCommand,
  type PutCommandInput,
} from "@aws-sdk/lib-dynamodb"
import { randomUUID } from "crypto"
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
      tableName,
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

  if (event.httpMethod !== "POST") {
    logger.error(
      { httpMethod: event.httpMethod, path: event.path },
      "Invalid method",
    )

    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Method Not Allowed. Only POST is supported.",
      }),
    }
  }

  logger.info(
    {
      path: event.path,
      httpMethod: event.httpMethod,
      headers: event.headers,
      body: event.body,
    },
    "Received event",
  )

  if (!event.body) {
    logger.error(
      { httpMethod: event.httpMethod, path: event.path },
      "Missing request body",
    )

    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Missing request body" }),
    }
  }

  let item: Record<string, unknown>
  try {
    item = JSON.parse(event.body)
  } catch (err) {
    logger.error(
      { message: err instanceof Error ? err.message : String(err) },
      "Invalid JSON",
    )

    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Invalid JSON body" }),
    }
  }

  const id = randomUUID()
  const now = new Date().toISOString()
  const newItem: Record<string, unknown> = {
    id,
    createdAt: now,
    ...item,
  }

  const params: PutCommandInput = {
    TableName: tableName,
    Item: newItem,
  }

  try {
    const data = await ddbDocClient.send(new PutCommand(params))
    const { Attributes, ...metadata } = data
    logger.info({ item: Attributes }, "Item created")
    logger.info(metadata, "PutCommand metadata")
  } catch (err) {
    logger.error(
      {
        message: err instanceof Error ? err.message : String(err),
        item: newItem,
      },
      "DynamoDB put error",
    )

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Internal Server Error" }),
    }
  }

  const response = {
    statusCode: 201,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newItem),
  }

  logger.info(
    {
      path: event.path,
      statusCode: response.statusCode,
      body: newItem,
    },
    "Sending response",
  )

  return response
}
