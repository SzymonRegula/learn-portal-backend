import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient();
const dynamoDb = DynamoDBDocument.from(client);

const getUserItem = async (userId) => {
  const params = {
    TableName: process.env.USERS_TABLE,
    Key: { id: userId },
  };

  const userResponse = await dynamoDb.get(params);

  return userResponse?.Item;
};

export default getUserItem;
