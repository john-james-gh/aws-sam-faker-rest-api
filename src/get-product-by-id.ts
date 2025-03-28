import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  GetCommand,
  type GetCommandInput,
} from "@aws-sdk/lib-dynamodb"
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
  const ddbEndpoint = process.env.LOCAL_DDB_ENDPOINT

  logger.info(
    {
      tableName,
      ddbEndpoint,
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

  const queryParams = event.queryStringParameters || {}
  const productId = queryParams.id

  if (!productId) {
    logger.error("Missing query parameter: id")
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Missing required query param: id" }),
    }
  }

  const params: GetCommandInput = {
    TableName: tableName,
    Key: {
      pk: "product",
      sk: productId,
    },
  }

  try {
    const data = await ddbDocClient.send(new GetCommand(params))

    if (!data.Item) {
      logger.warn(`Product not found for sk: ${productId}`)
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Product not found" }),
      }
    }

    logger.info("DynamoDB GetCommand success")
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product: data.Item }),
    }
  } catch (err) {
    logger.error(
      {
        message: err instanceof Error ? err.message : String(err),
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
