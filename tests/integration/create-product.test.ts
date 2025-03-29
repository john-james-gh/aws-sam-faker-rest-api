import { afterAll, describe, expect, test } from "@jest/globals"
import request from "supertest"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb"

const BASE_URL = "http://127.0.0.1:3000"

const ddbClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ endpoint: process.env.LOCAL_DDB_ENDPOINT }),
)

let pk: string
let sk: string

describe("Faker REST API Integration", () => {
  afterAll(async () => {
    if (pk && sk) {
      await ddbClient.send(
        new DeleteCommand({
          TableName: process.env.FAKER_TABLE,
          Key: { pk, sk },
        }),
      )
    }
  })

  test("POST /products/create should create a product", async () => {
    const product = {
      name: "Test Product",
      price: 99.99,
    }

    const res = await request(BASE_URL).post("/products/create").send(product)

    expect(res.statusCode).toBe(201)
    expect(res.body).toHaveProperty("pk")
    expect(res.body).toHaveProperty("sk")
    expect(res.body).toHaveProperty("name", "Test Product")
    expect(res.body).toHaveProperty("price", 99.99)

    pk = res.body.pk
    sk = res.body.sk
  })
})
