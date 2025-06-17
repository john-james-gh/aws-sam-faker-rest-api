import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  ScanCommand,
  type ScanCommandInput,
} from "@aws-sdk/lib-dynamodb"
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

  // Parse query string parameters for pagination and limit
  const queryParams = event.queryStringParameters || {}
  const limit = queryParams.limit ? parseInt(queryParams.limit) : 10

  let exclusiveStartKey
  if (queryParams.nextToken) {
    try {
      // Decode and parse the nextToken for pagination
      exclusiveStartKey = JSON.parse(
        Buffer.from(queryParams.nextToken, "base64").toString("utf-8"),
      )
      logger.info("Parsed nextToken")
    } catch {
      logger.warn("Invalid nextToken format")
    }
  }

  const params: ScanCommandInput = {
    TableName: tableName,
    Limit: limit,
    ExclusiveStartKey: exclusiveStartKey,
  }

  try {
    // Attempt to scan the table for products
    const data = await ddbDocClient.send(new ScanCommand(params))

    const items = data.Items || []
    // Encode the LastEvaluatedKey as nextToken for pagination
    const nextToken = data.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(data.LastEvaluatedKey)).toString("base64")
      : null

    logger.info("DynamoDB ScanCommand success")
    // Return 200 with the retrieved items and nextToken (if any)
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        nextToken,
      }),
    }
  } catch (err) {
    // Log and return 500 on DynamoDB error
    logger.error(
      {
        error: err instanceof Error ? err.message : String(err),
      },
      "DynamoDB ScanCommand error",
    )
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Internal server error",
      }),
    }
  }
}
