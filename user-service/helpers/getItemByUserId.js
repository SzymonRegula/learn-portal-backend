import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient();
const dynamoDb = DynamoDBDocument.from(client);

const getItemByUserId = async (userId, tableName) => {
  const params = {
    TableName: tableName,
    IndexName: "UserIdIndex",
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": userId,
    },
  };

  const response = await dynamoDb.query(params);
  return response?.Items[0];
};

export default getItemByUserId;
