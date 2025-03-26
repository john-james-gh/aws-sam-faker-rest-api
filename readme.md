# AWS SAM Template for Node.js TypeScript Lambda

This repository contains a template for developing AWS Lambda functions using Node.js and TypeScript with the AWS Serverless Application Model (SAM). It provides a starting point for building, testing, and deploying serverless applications.

## Common SAM Commands

- **Build the project:**

  ```bash
  sam build
  ```

- **Local invoke your function:**

  ```bash
  sam local invoke MyTemplateGetAllFunction --event events/get-all-event.json --env-vars env.json
  ```

- **Remote invoke your function:**

  ```bash
  sam remote invoke MyTemplateGetAllFunction --stack-name aws-sam-faker-rest-api
  ```

- **Start the local API Gateway:**

  ```bash
  sam local start-api --env-vars env.json
  ```

- **Validate the SAM template:**

  ```bash
  sam validate --lint
  ```

- **Deploy the stack (guided mode):**

  ```bash
  sam deploy --guided
  ```

- **Run Local DynamoDB:**

  ```bash
  docker run -p 8000:8000 amazon/dynamodb-local
  ```

- **Create Local DynamoDB Table:**

  ```bash
  aws dynamodb create-table `
    --table-name FakerRestApi-ProductsDynamoDbTable-1KL76QRAAUCEN `
    --attribute-definitions AttributeName=id,AttributeType=S `
    --key-schema AttributeName=id,KeyType=HASH `
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 `
    --endpoint-url http://localhost:8000
  ```

- **Check Local DynamoDB Tables:**

  ```bash
  aws dynamodb list-tables --endpoint-url http://localhost:8000
  ```
