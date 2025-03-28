import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb"
import { mockClient } from "aws-sdk-client-mock"
import { describe, beforeEach, it, expect } from "@jest/globals"
import type { APIGatewayProxyEvent } from "aws-lambda"

import { handler } from "../src/get-product-by-id"

describe("Test GetProductById Function", () => {
  const ddbMock = mockClient(DynamoDBDocumentClient)

  beforeEach(() => {
    ddbMock.reset()
    process.env.FAKER_TABLE = "TestTable"
  })

  it("should return 200 and product when found", async () => {
    const product = {
      pk: "product",
      sk: "1234-5678-uuid",
      id: "1234-5678-uuid",
      name: "Test Product",
      price: 10,
      createdAt: "2024-01-01T00:00:00.000Z",
    }

    ddbMock.on(GetCommand).resolves({ Item: product })

    const event = {
      httpMethod: "GET",
      queryStringParameters: { id: "1234-5678-uuid" },
    } as unknown as APIGatewayProxyEvent

    const result = await handler(event)
    const body = JSON.parse(result.body)

    expect(result.statusCode).toBe(200)
    expect(body).toHaveProperty("product")
    expect(body.product).toMatchObject(product)
  })

  it("should return 404 when product is not found", async () => {
    ddbMock.on(GetCommand).resolves({ Item: undefined })

    const event = {
      httpMethod: "GET",
      queryStringParameters: { id: "nonexistent-id" },
    } as unknown as APIGatewayProxyEvent

    const result = await handler(event)
    const body = JSON.parse(result.body)

    expect(result.statusCode).toBe(404)
    expect(body).toEqual({ message: "Product not found" })
  })

  it("should return 400 when id param is missing", async () => {
    const event = {
      httpMethod: "GET",
      queryStringParameters: {},
    } as APIGatewayProxyEvent

    const result = await handler(event)
    const body = JSON.parse(result.body)

    expect(result.statusCode).toBe(400)
    expect(body).toEqual({ message: "Missing required query param: id" })
  })

  it("should return 500 if DynamoDB throws", async () => {
    ddbMock.on(GetCommand).rejects(new Error("boom"))

    const event = {
      httpMethod: "GET",
      queryStringParameters: { id: "explode" },
    } as unknown as APIGatewayProxyEvent

    const result = await handler(event)
    const body = JSON.parse(result.body)

    expect(result.statusCode).toBe(500)
    expect(body).toEqual({ message: "Internal server error" })
  })

  it("should return 500 if FAKER_TABLE is not set", async () => {
    const original = process.env.FAKER_TABLE
    delete process.env.FAKER_TABLE

    const event = {
      httpMethod: "GET",
      queryStringParameters: { id: "oops" },
    } as unknown as APIGatewayProxyEvent

    const result = await handler(event)
    const body = JSON.parse(result.body)

    expect(result.statusCode).toBe(500)
    expect(body).toEqual({ message: "Server misconfiguration" })

    process.env.FAKER_TABLE = original
  })

  it("should return 500 if non-Error is thrown", async () => {
    ddbMock.on(GetCommand).rejects("weird string error")

    const event = {
      httpMethod: "GET",
      queryStringParameters: { id: "mystery" },
    } as unknown as APIGatewayProxyEvent

    const result = await handler(event)
    const body = JSON.parse(result.body)

    expect(result.statusCode).toBe(500)
    expect(body).toEqual({ message: "Internal server error" })
  })
})
