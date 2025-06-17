import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  GetCommand,
  type GetCommandInput,
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

  // Parse query string parameters to get the product ID
  const queryParams = event.queryStringParameters || {}
  const productId = queryParams.id

  // Return 400 if product ID is missing
  if (!productId) {
    logger.error("Missing query parameter: id")
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Missing required query param: id" }),
    }
  }

  // Prepare the DynamoDB GetCommand input
  const params: GetCommandInput = {
    TableName: tableName,
    Key: {
      pk: "product", // Partition key
      sk: productId, // Sort key (product ID)
    },
  }

  try {
    // Attempt to get the product from DynamoDB
    const data = await ddbDocClient.send(new GetCommand(params))

    // Return 404 if product is not found
    if (!data.Item) {
      logger.warn(`Product not found for sk: ${productId}`)
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Product not found" }),
      }
    }

    logger.info("DynamoDB GetCommand success")
    // Return 200 with the retrieved product
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product: data.Item }),
    }
  } catch (err) {
    // Log and return 500 on DynamoDB error
    logger.error(
      {
        error: err instanceof Error ? err.message : String(err),
      },
      "DynamoDB GetCommand error",
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
