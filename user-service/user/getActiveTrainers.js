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

    const activeTrainers = trainersResponse.Items.filter(
      (trainer) => trainer.isActive
    );

    if (activeTrainers.length === 0) {
      return response(404, {
        activeTrainers,
        message: "There are no active trainers",
      });
    }

    const responseData = activeTrainers.map((trainer) => ({
      id: trainer.id,
      firstName: trainer.firstName,
      lastName: trainer.lastName,
      specialization: trainer.specialization,
    }));

    return response(200, { trainers: responseData });
  } catch (error) {
    console.error(error);
    return response(500, { message: "Couldn't get the trainers" });
  }
};
