import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  PutCommand,
  type PutCommandInput,
} from "@aws-sdk/lib-dynamodb"
import { randomUUID } from "node:crypto"
import { logger } from "./utils/logger"

const isLocal = Boolean(process.env.LOCAL_DDB_ENDPOINT)
// Initialize DynamoDB client, using local endpoint if specified
const client = new DynamoDBClient({
  endpoint: isLocal ? process.env.LOCAL_DDB_ENDPOINT : undefined,
})
const ddbDocClient = DynamoDBDocumentClient.from(client)

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const tableName = process.env.FAKER_TABLE
  const ddbEndpoint = process.env.LOCAL_DDB_ENDPOINT

  logger.info(
    {
      tableName,
      ddbEndpoint,
    },
    "Configuration",
  )

  // Return 500 if table name is not set
  if (!tableName) {
    logger.error("Missing FAKER_TABLE environment variable")
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Server misconfiguration" }),
    }
  }

  // Return 400 if request body is missing
  if (!event.body) {
    logger.error("Missing request body")
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Missing request body" }),
    }
  }

  let parsedBody: Record<string, unknown>
  try {
    // Attempt to parse the JSON body
    parsedBody = JSON.parse(event.body)
    logger.info("Parsed JSON body")
  } catch (err) {
    // Return 400 if JSON is invalid
    logger.error(
      {
        error: err instanceof Error ? err.message : String(err),
      },
      "Invalid JSON body",
    )
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Invalid JSON body" }),
    }
  }

  // Generate a unique ID and timestamp for the new product
  const id = randomUUID()
  const now = new Date().toISOString()

  // Construct the item to be inserted into DynamoDB
  const item = {
    pk: "product", // Partition key
    sk: id, // Sort key (unique product ID)
    createdAt: now, // Creation timestamp
    ...parsedBody, // Spread the rest of the product fields
  }

  const params: PutCommandInput = {
    TableName: tableName,
    Item: item,
  }

  try {
    // Attempt to insert the item into DynamoDB
    await ddbDocClient.send(new PutCommand(params))

    logger.info("DynamoDB PutCommand success")
    // Return 201 with the created item
    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    }
  } catch (err) {
    // Log and return 500 on DynamoDB error
    logger.error(
      {
        error: err instanceof Error ? err.message : String(err),
      },
      "DynamoDB PutCommand error",
    )
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Internal server error" }),
    }
  }
}
