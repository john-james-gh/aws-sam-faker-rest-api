import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb"
import { mockClient } from "aws-sdk-client-mock"
import { describe, beforeEach, it, expect } from "@jest/globals"
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"

import { handler } from "../src/get-all-products"

describe("Test GetAllProducts Function", () => {
  const ddbMock = mockClient(DynamoDBDocumentClient)

  beforeEach(() => {
    ddbMock.reset()
  })

  it("should return 200 when query succeeds", async () => {
    const items = [{ id: "id1" }, { id: "id2" }]

    ddbMock.on(ScanCommand).resolves({
      Items: items,
    })

    const event = {
      httpMethod: "GET",
    } as APIGatewayProxyEvent

    const result = await handler(event)

    const expectedResult: APIGatewayProxyResult = {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items),
    }
    expect(result.statusCode).toBe(200)
    expect(result).toEqual(expectedResult)
  })

  it("should return 405 for non-GET requests", async () => {
    const event = {
      httpMethod: "POST",
      path: "/get-all-products",
    } as APIGatewayProxyEvent

    const result = await handler(event)

    expect(result.statusCode).toBe(405)
    expect(JSON.parse(result.body)).toEqual({
      message: "Method Not Allowed. Only GET is supported.",
    })
  })

  it("should return 500 when DynamoDB throws", async () => {
    ddbMock.on(ScanCommand).rejects(new Error("DDB exploded"))

    const event = {
      httpMethod: "GET",
      path: "/get-all-products",
    } as APIGatewayProxyEvent

    const result = await handler(event)

    expect(result.statusCode).toBe(500)
    expect(JSON.parse(result.body)).toEqual({
      message: "Internal Server Error",
    })
  })

  it("should return 500 if FAKER_TABLE is not set", async () => {
    const originalTable = process.env.FAKER_TABLE
    delete process.env.FAKER_TABLE // simulate unset

    const event = {
      httpMethod: "GET",
      path: "/get-all-products",
    } as APIGatewayProxyEvent

    const result = await handler(event)

    expect(result.statusCode).toBe(500)
    expect(JSON.parse(result.body)).toEqual({
      message: "Server misconfiguration",
    })

    process.env.FAKER_TABLE = originalTable // restore it
  })

  it("should return 500 and handle non-Error thrown gracefully", async () => {
    ddbMock.on(ScanCommand).rejects("something bad") // not an instance of Error

    const event = {
      httpMethod: "GET",
    } as APIGatewayProxyEvent

    const result = await handler(event)

    expect(result.statusCode).toBe(500)
    expect(JSON.parse(result.body)).toEqual({
      message: "Internal Server Error",
    })
  })

  it("should return 200 and an empty array when DynamoDB returns no Items", async () => {
    ddbMock.on(ScanCommand).resolves({}) // no Items

    const event = {
      httpMethod: "GET",
    } as APIGatewayProxyEvent

    const result = await handler(event)

    expect(result.statusCode).toBe(200)
    expect(JSON.parse(result.body)).toEqual([])
  })
})
