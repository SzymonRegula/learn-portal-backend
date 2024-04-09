import { response } from "../helpers/index.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient();
const dynamoDb = DynamoDBDocument.from(client);

export const handler = async (event) => {
  try {
    const params = {
      TableName: process.env.SPECIALIZATIONS_TABLE,
    };

    const specializationsResponse = await dynamoDb.scan(params);

    const specializations = specializationsResponse.Items;

    if (specializations.length === 0) {
      return response(404, {
        specializations: [],
        message: "There are no specializations",
      });
    }

    return response(200, specializations);
  } catch (error) {
    console.error(error);
    return response(500, { message: "Couldn't get the trainers" });
  }
};
