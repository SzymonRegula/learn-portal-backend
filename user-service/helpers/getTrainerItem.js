import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient();
const dynamoDb = DynamoDBDocument.from(client);

const getTrainerItem = async (trainerId) => {
  const params = {
    TableName: process.env.TRAINERS_TABLE,
    Key: { id: trainerId },
  };

  const trainerResponse = await dynamoDb.get(params);

  return trainerResponse?.Item;
};

export default getTrainerItem;
