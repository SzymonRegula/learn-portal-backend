import { response } from "../helpers/index.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient();
const dynamoDb = DynamoDBDocument.from(client);

export const handler = async (event) => {
  try {
    const params = {
      TableName: process.env.TRAININGS_TABLE,
    };

    const trainingsResponse = await dynamoDb.scan(params);

    const trainings = trainingsResponse.Items;

    if (trainings.length === 0) {
      return response(404, {
        message: "There are no trainings",
      });
    }

    return response(200, trainings);
  } catch (error) {
    console.error(error);
    return response(500, { message: "Couldn't get the trainings" });
  }
};
