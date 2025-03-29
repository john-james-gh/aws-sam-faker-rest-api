export default () => {
  process.env.FAKER_TABLE = "FakerRestApi-ProductsDynamoDbTable-1KL76QRAUCEN"
  process.env.LOCAL_DDB_ENDPOINT = "http://host.docker.internal:8000"
}
