import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb"
import { mockClient } from "aws-sdk-client-mock"
import { describe, beforeEach, it, expect } from "@jest/globals"
import type { APIGatewayProxyEvent } from "aws-lambda"

import { handler } from "../../src/create-product"

describe("Test CreateProduct Function", () => {
  const ddbMock = mockClient(DynamoDBDocumentClient)

  beforeEach(() => {
    ddbMock.reset()
    process.env.FAKER_TABLE = "TestTable"
  })

  it("should return 201 when item is successfully created", async () => {
    ddbMock.on(PutCommand).resolves({})

    const event = {
      httpMethod: "POST",
      body: JSON.stringify({
        name: "Test Product",
        price: 10,
        category: "electronics",
        description: "Something cool",
      }),
    } as APIGatewayProxyEvent

    const result = await handler(event)
    const responseBody = JSON.parse(result.body)

    expect(result.statusCode).toBe(201)
    expect(responseBody).toHaveProperty("createdAt", expect.any(String))
    expect(responseBody).toHaveProperty("pk", "product")
    expect(responseBody).toHaveProperty(
      "sk",
      expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      ), // UUID format
    )
    expect(responseBody).toHaveProperty("name", "Test Product")
    expect(responseBody).toHaveProperty("price", 10)
    expect(responseBody).toHaveProperty("category", "electronics")
  })

  it("should return 400 when request body is missing", async () => {
    const event = {
      httpMethod: "POST",
    } as APIGatewayProxyEvent

    const result = await handler(event)
    const responseBody = JSON.parse(result.body)

    expect(result.statusCode).toBe(400)
    expect(responseBody).toEqual({
      message: "Missing request body",
    })
  })

  it("should return 400 when JSON is invalid", async () => {
    const event = {
      httpMethod: "POST",
      body: "{notValidJson}",
    } as APIGatewayProxyEvent

    const result = await handler(event)
    const responseBody = JSON.parse(result.body)

    expect(result.statusCode).toBe(400)
    expect(responseBody).toEqual({
      message: "Invalid JSON body",
    })
  })

  it("should return 500 when DynamoDB throws", async () => {
    ddbMock.on(PutCommand).rejects(new Error("DDB exploded"))

    const event = {
      httpMethod: "POST",
      body: JSON.stringify({
        name: "Kaboom",
        price: 25,
        category: "fail",
      }),
    } as APIGatewayProxyEvent

    const result = await handler(event)
    const responseBody = JSON.parse(result.body)

    expect(result.statusCode).toBe(500)
    expect(responseBody).toEqual({
      message: "Internal server error",
    })
  })

  it("should return 500 if FAKER_TABLE is not set", async () => {
    const original = process.env.FAKER_TABLE
    delete process.env.FAKER_TABLE

    const event = {
      httpMethod: "POST",
      body: JSON.stringify({
        name: "Config fail",
        price: 15,
        category: "weird",
      }),
    } as APIGatewayProxyEvent

    const result = await handler(event)
    const responseBody = JSON.parse(result.body)

    expect(result.statusCode).toBe(500)
    expect(responseBody).toEqual({
      message: "Server misconfiguration",
    })

    process.env.FAKER_TABLE = original
  })

  it("should return 500 if non-Error is thrown", async () => {
    ddbMock.on(PutCommand).rejects("what even is this")

    const event = {
      httpMethod: "POST",
      body: JSON.stringify({
        name: "Mystery",
        price: 33,
        category: "bizarre",
      }),
    } as APIGatewayProxyEvent

    const result = await handler(event)
    const responseBody = JSON.parse(result.body)

    expect(result.statusCode).toBe(500)
    expect(responseBody).toEqual({
      message: "Internal server error",
    })
  })
})
