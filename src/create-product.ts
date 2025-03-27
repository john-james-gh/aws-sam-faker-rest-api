import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  PutCommand,
  type PutCommandInput,
} from "@aws-sdk/lib-dynamodb"
import { randomUUID } from "crypto"
import { logger } from "./utils/logger"

const isLocal = Boolean(process.env.LOCAL_DDB_ENDPOINT)
const client = new DynamoDBClient({
  endpoint: isLocal ? process.env.LOCAL_DDB_ENDPOINT : undefined,
})
const ddbDocClient = DynamoDBDocumentClient.from(client)

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
    logger.error("Invalid method")

    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Method Not Allowed. Only POST is supported.",
      }),
    }
  }

  if (!event.body) {
    logger.error("Missing request body")

    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Missing request body" }),
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

  let parsedBody: Record<string, unknown>
  try {
    parsedBody = JSON.parse(event.body)
    logger.info("Parsed JSON body")
  } catch (err) {
    logger.error(
      {
        body: event.body,
        message: err instanceof Error ? err.message : String(err),
      },
      "Invalid JSON body",
    )

    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Invalid JSON body" }),
    }
  }

  const id = randomUUID()
  const now = new Date().toISOString()

  const category = parsedBody.category as string
  if (!category) {
    logger.error("Missing required field: category")

    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Missing required field: category" }),
    }
  }

  const item = {
    pk: `category#${category}`,
    sk: `product#${id}`,
    gsi_pk: "all",
    id,
    createdAt: now,
    ...parsedBody,
  }

  const params: PutCommandInput = {
    TableName: tableName,
    Item: item,
  }

  try {
    await ddbDocClient.send(new PutCommand(params))
    logger.info(
      {
        statusCode: 201,
        body: item,
      },
      "DynamoDB put response",
    )

    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    }
  } catch (err) {
    logger.error(
      {
        statusCode: 500,
        body: item,
        message: err instanceof Error ? err.message : String(err),
      },
      "DynamoDB put error",
    )

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Internal server error" }),
    }
  }
}
