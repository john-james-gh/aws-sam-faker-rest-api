# AWS SAM Template for Node.js TypeScript Lambda

This repository contains a template for developing AWS Lambda functions using Node.js and TypeScript with the AWS Serverless Application Model (SAM). It provides a starting point for building, testing, and deploying serverless applications.

## Common SAM Commands

- **Build the project:**

  ```bash
  sam build
  ```

- **Local invoke your function:**

  ```bash
  sam local invoke MyTemplateGetAllFunction --event events/get-all-event.json
  ```

- **Remote invoke your function:**

  ```bash
  sam remote invoke MyTemplateGetAllFunction --stack-name aws-sam-faker-rest-api
  ```

- **Start the local API Gateway:**

  ```bash
  sam local start-api
  ```

- **Validate the SAM template:**

  ```bash
  sam validate --lint
  ```

- **Deploy the stack (guided mode):**

  ```bash
  sam deploy --guided
  ```
