import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient();
const dynamoDb = DynamoDBDocument.from(client);

const getSpecializationItem = async (specializationId) => {
  const params = {
    TableName: process.env.SPECIALIZATIONS_TABLE,
    Key: { id: specializationId },
  };

  const specializationResponse = await dynamoDb.get(params);

  return specializationResponse?.Item;
};

export default getSpecializationItem;
