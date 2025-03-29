import { beforeAll, afterAll, describe, expect, test } from "@jest/globals"
import request from "supertest"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  type PutCommandInput,
  type DeleteCommandInput,
} from "@aws-sdk/lib-dynamodb"
import { randomUUID } from "node:crypto"

const BASE_URL = "http://127.0.0.1:3000"

const ddbClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ endpoint: process.env.LOCAL_DDB_ENDPOINT }),
)

describe("Faker REST API Integration", () => {
  const id = randomUUID()
  const now = new Date().toISOString()
  const item = {
    pk: "product",
    sk: id,
    createdAt: now,
    name: "Test Product",
    price: 99.99,
  }

  beforeAll(async () => {
    const params: PutCommandInput = {
      TableName: process.env.FAKER_TABLE,
      Item: item,
    }
    await ddbClient.send(new PutCommand(params))
  })

  afterAll(async () => {
    const deleteParams: DeleteCommandInput = {
      TableName: process.env.FAKER_TABLE,
      Key: {
        pk: "product",
        sk: id,
      },
    }
    await ddbClient.send(new DeleteCommand(deleteParams))
  })

  test("GET /products/by-id should return a single product", async () => {
    const res = await request(BASE_URL).get("/products/by-id").query({ id })

    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty("product")
    expect(res.body.product).toMatchObject({
      pk: "product",
      sk: id,
      name: "Test Product",
      price: 99.99,
    })
  })
})
