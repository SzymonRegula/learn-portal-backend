import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient();
const dynamoDb = DynamoDBDocument.from(client);

const checkIfEmailExists = async (email) => {
  const emailParams = {
    TableName: process.env.USERS_TABLE,
    IndexName: "EmailIndex",
    KeyConditionExpression: "email = :email",
    ExpressionAttributeValues: {
      ":email": email,
    },
  };

  const emailResult = await dynamoDb.query(emailParams);

  if (emailResult.Items && emailResult.Items.length > 0) {
    return true;
  }
  return false;
};

export default checkIfEmailExists;
