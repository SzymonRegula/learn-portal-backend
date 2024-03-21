import { getUserItem, response } from "../helpers/index.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import Joi from "joi";

const client = new DynamoDBClient();
const dynamoDb = DynamoDBDocument.from(client);

const schema = Joi.object({
  data: Joi.string().uri(),
});

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    const { error } = schema.validate(body);

    if (error) {
      console.error(error);
      return response(400, { message: error.details[0].message });
    }

    const { userId } = event.requestContext.authorizer.lambda;

    const user = await getUserItem(userId);

    if (!user) {
      return response(404, { message: "User not found" });
    }

    const updateParams = {
      TableName: process.env.USERS_TABLE,
      Key: { id: userId },
      UpdateExpression: "set #photo = :data",
      ExpressionAttributeNames: { "#photo": "photo" },
      ExpressionAttributeValues: {
        ":data": body.data,
      },
    };

    await dynamoDb.update(updateParams);
    return response(200, { message: "Photo updated successfully" });
  } catch (error) {
    console.error(error);
    return response(500, { message: "Couldn't update the photo" });
  }
};
