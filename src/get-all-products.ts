import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  ScanCommand,
  type ScanCommandInput,
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

  if (event.httpMethod !== "GET") {
    logger.error("Invalid method")
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Method Not Allowed. Only GET is supported.",
      }),
    }
  }

  const queryParams = event.queryStringParameters || {}
  const limit = queryParams.limit ? parseInt(queryParams.limit) : 10

  let exclusiveStartKey
  if (queryParams.nextToken) {
    try {
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
    const data = await ddbDocClient.send(new ScanCommand(params))

    const items = data.Items || []
    const nextToken = data.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(data.LastEvaluatedKey)).toString("base64")
      : null

    logger.info(
      {
        statusCode: 200,
        itemCount: items.length,
        nextTokenPresent: Boolean(nextToken),
      },
      "DynamoDB scan response",
    )
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        nextToken,
      }),
    }
  } catch (err) {
    logger.error(
      {
        statusCode: 500,
        message: err instanceof Error ? err.message : String(err),
      },
      "DynamoDB scan error",
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
