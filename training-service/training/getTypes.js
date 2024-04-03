import { response } from "../helpers/index.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient();
const dynamoDb = DynamoDBDocument.from(client);

export const handler = async (event) => {
  try {
    const params = {
      TableName: process.env.TRAINING_TYPES_TABLE,
    };

    const typesResponse = await dynamoDb.scan(params);

    const types = typesResponse.Items;

    if (types.length === 0) {
      return response(404, {
        message: "There are no types",
      });
    }

    return response(200, types);
  } catch (error) {
    console.error(error);
    return response(500, { message: "Couldn't get the types" });
  }
};
