import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient();
const dynamoDb = DynamoDBDocument.from(client);

const checkIfUsernameExists = async (username) => {
  const usernameParams = {
    TableName: process.env.USERS_TABLE,
    IndexName: "UsernameIndex",
    KeyConditionExpression: "username = :username",
    ExpressionAttributeValues: {
      ":username": username,
    },
  };

  const usernameResult = await dynamoDb.query(usernameParams);

  if (usernameResult.Items && usernameResult.Items.length > 0) {
    return true;
  }
  return false;
};

export default checkIfUsernameExists;
