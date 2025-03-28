import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb"
import { mockClient } from "aws-sdk-client-mock"
import { describe, beforeEach, it, expect } from "@jest/globals"
import type { APIGatewayProxyEvent } from "aws-lambda"

import { handler } from "../src/get-all-products"

describe("Test GetAllProducts Function using ScanCommand", () => {
  const ddbMock = mockClient(DynamoDBDocumentClient)

  beforeEach(() => {
    ddbMock.reset()
    process.env.FAKER_TABLE = "TestTable"
  })

  it("should return 200 with items and nextToken", async () => {
    const items = [{ pk: "category#test", sk: "product#1" }]
    const lastKey = { pk: "category#test", sk: "product#2" }

    ddbMock
      .on(ScanCommand)
      .resolves({ Items: items, LastEvaluatedKey: lastKey })

    const event = {
      httpMethod: "GET",
      queryStringParameters: {
        limit: "10",
      },
    } as unknown as APIGatewayProxyEvent

    const result = await handler(event)

    const expectedBody = {
      items,
      nextToken: Buffer.from(JSON.stringify(lastKey)).toString("base64"),
    }

    expect(result.statusCode).toBe(200)
    expect(JSON.parse(result.body)).toEqual(expectedBody)
  })

  it("should return 200 with no nextToken when LastEvaluatedKey is missing", async () => {
    const items = [{ pk: "category#test", sk: "product#1" }]

    ddbMock.on(ScanCommand).resolves({ Items: items })

    const event = {
      httpMethod: "GET",
      queryStringParameters: {
        limit: "5",
      },
    } as unknown as APIGatewayProxyEvent

    const result = await handler(event)
    const body = JSON.parse(result.body)

    expect(result.statusCode).toBe(200)
    expect(body.items).toEqual(items)
    expect(body.nextToken).toBeNull()
  })

  it("should decode and use nextToken correctly", async () => {
    const decodedKey = { pk: "category#books", sk: "product#42" }
    const encoded = Buffer.from(JSON.stringify(decodedKey)).toString("base64")
    const items = [{ pk: "category#books", sk: "product#43" }]

    ddbMock.on(ScanCommand).resolves({ Items: items })

    const event = {
      httpMethod: "GET",
      queryStringParameters: {
        nextToken: encoded,
      },
    } as unknown as APIGatewayProxyEvent

    const result = await handler(event)
    const body = JSON.parse(result.body)

    expect(result.statusCode).toBe(200)
    expect(body.items).toEqual(items)
    expect(body.nextToken).toBeNull()
  })

  it("should return 405 for non-GET requests", async () => {
    const event = {
      httpMethod: "POST",
    } as unknown as APIGatewayProxyEvent

    const result = await handler(event)
    expect(result.statusCode).toBe(405)
    expect(JSON.parse(result.body)).toEqual({
      message: "Method Not Allowed. Only GET is supported.",
    })
  })

  it("should return 500 if DynamoDB throws", async () => {
    ddbMock.on(ScanCommand).rejects(new Error("DDB failed"))

    const event = {
      httpMethod: "GET",
      queryStringParameters: {},
    } as unknown as APIGatewayProxyEvent

    const result = await handler(event)

    expect(result.statusCode).toBe(500)
    expect(JSON.parse(result.body)).toEqual({
      message: "Internal server error",
    })
  })

  it("should return 500 if FAKER_TABLE is not set", async () => {
    const original = process.env.FAKER_TABLE
    delete process.env.FAKER_TABLE

    const event = {
      httpMethod: "GET",
      queryStringParameters: {},
    } as unknown as APIGatewayProxyEvent

    const result = await handler(event)

    expect(result.statusCode).toBe(500)
    expect(JSON.parse(result.body)).toEqual({
      message: "Server misconfiguration",
    })

    process.env.FAKER_TABLE = original
  })
})
