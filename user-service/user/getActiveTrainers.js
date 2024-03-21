import { response } from "../helpers/index.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient();
const dynamoDb = DynamoDBDocument.from(client);

export const handler = async (event) => {
  try {
    const params = {
      TableName: process.env.TRAINERS_TABLE,
    };

    const trainersResponse = await dynamoDb.scan(params);

    if (!trainersResponse?.Items) {
      return response(404, { message: "Trainers not found" });
    }

    const activeTrainers = trainersResponse.Items.filter(
      (trainer) => trainer.isActive
    );

    return response(200, { activeTrainers, message: "Trainers found" });
  } catch (error) {
    console.error(error);
    return response(500, { message: "Couldn't get the trainers" });
  }
};
