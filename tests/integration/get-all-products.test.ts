// Integration Test Note: These tests require that the local Gateway API and DynamoDB are running.
import { describe, expect, test } from "@jest/globals"
import request from "supertest"

const BASE_URL = "http://127.0.0.1:3000"

describe("Faker REST API Integration", () => {
  test("GET /products/all should return all products", async () => {
    const res = await request(BASE_URL).get("/products/all")

    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty("items")
    expect(res.body).toHaveProperty("nextToken")
  })
})
