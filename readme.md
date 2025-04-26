# 🎲 AWS SAM Faker REST API

Welcome to the **AWS SAM Faker REST API**. A serverless REST API template for Node.js and TypeScript, using the **AWS Serverless Application Model (SAM)**. This project provides a clean, testable, DynamoDB-powered backend with local development support via Docker.

> 🚀 Ideal for learning, prototyping, or building small serverless services with DynamoDB integration.

---

## 🛠️ Tech Stack

- 🟢 AWS Lambda (SAM) — Serverless compute
- 🧩 DynamoDB — NoSQL database with GSI support
- ⚡ [esbuild](https://esbuild.github.io/) — Ultra-fast builds
- 🪵 [Pino](https://github.com/pinojs/pino) + pino-pretty — Fast, structured logging
- 🛡️ TypeScript — Type safety
- 🧪 Jest — Unit + integration testing
- 🧹 ESLint + Prettier — Code linting and formatting
- 🔥 Local DynamoDB via Docker for easy testing

---

## 📂 Project Structure

```
├── events/                   # Sample event payloads for testing
├── src/                      # Lambda handlers and core logic
├── tests/                    # Unit and integration tests
├── client.local.http         # Example HTTP requests for local testing
├── env.json                  # Local environment variables
├── template.yaml             # AWS SAM template definition
├── samconfig.toml            # Deployment configuration
├── tsconfig.json             # TypeScript config
├── jest.config.js            # Jest configuration
├── eslint.config.js          # ESLint config
├── .prettierrc               # Prettier config
```

---

## ⚡ Common SAM Commands

### 🏗️ Build the project:
```bash
sam build
```

### 🧪 Local invoke your function:
```bash
sam local invoke MyTemplateGetAllFunction --event events/get-all-products.json --env-vars env.json
```

### 🌐 Remote invoke your function:
```bash
sam remote invoke MyTemplateGetAllFunction --stack-name aws-sam-faker-rest-api
```

### 🚀 Start the local API Gateway:
```bash
sam local start-api --env-vars env.json
```

### ✅ Validate the SAM template:
```bash
sam validate --lint
```

### 📤 Deploy the stack (guided mode):
```bash
sam deploy --guided
```

---

## 🧪 Local DynamoDB Setup

### 🐳 Run Local DynamoDB:
```bash
docker run -p 8000:8000 -d amazon/dynamodb-local
```

### 🛠️ Create Local DynamoDB Table:
```bash
aws dynamodb create-table \
  --table-name FakerRestApi-ProductsDynamoDbTable-1KL76QRAUCEN \
  --attribute-definitions AttributeName=pk,AttributeType=S AttributeName=sk,AttributeType=S \
  --key-schema AttributeName=pk,KeyType=HASH AttributeName=sk,KeyType=RANGE \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --endpoint-url http://localhost:8000
```

### 🛠️ Create Local DynamoDB Table with GSI:
```bash
aws dynamodb create-table \
  --table-name FakerRestApi-ProductsDynamoDbTable-1KL76QRAUCEN \
  --attribute-definitions AttributeName=pk,AttributeType=S AttributeName=sk,AttributeType=S AttributeName=gsi_pk,AttributeType=S \
  --key-schema AttributeName=pk,KeyType=HASH AttributeName=sk,KeyType=RANGE \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --global-secondary-indexes '[@{"IndexName":"GSI_AllProducts","KeySchema":[{"AttributeName":"gsi_pk","KeyType":"HASH"},{"AttributeName":"sk","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"},"ProvisionedThroughput":{"ReadCapacityUnits":5,"WriteCapacityUnits":5}}]' \
  --endpoint-url http://localhost:8000
```

### 🔍 Check Local DynamoDB Tables:
```bash
aws dynamodb list-tables --endpoint-url http://localhost:8000
```

---

## 🧹 Available NPM Scripts

| Script                       | Purpose                                      |
|--------------------------------|----------------------------------------------|
| `npm run type-check`           | Run TypeScript type checking                |
| `npm run lint`                 | Lint the codebase with ESLint (auto-fix)     |
| `npm run test-unit`           | Run unit tests with coverage                |
| `npm run test-unit-watch`     | Watch mode for unit tests                   |
| `npm run test-integration`    | Run integration tests with coverage         |
| `npm run test-integration-watch` | Watch mode for integration tests          |
| `npm run format`               | Format the codebase with Prettier           |

---

## 📜 License

MIT License.

---
