import { getUserItem, response } from "../helpers/index.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import Joi from "joi";

const client = new DynamoDBClient();
const dynamoDb = DynamoDBDocument.from(client);

const schema = Joi.object({
  currentPassword: Joi.string().min(6).max(30).required(),
  newPassword: Joi.string().min(6).max(30).required(),
});

export const handler = async (event) => {
  try {
    const data = JSON.parse(event.body);

    const { error } = schema.validate(data);

    if (error) {
      console.error(error);
      return response(400, { message: error.details[0].message });
    }

    const { userId } = event.requestContext.authorizer.lambda;

    const user = await getUserItem(userId);

    if (!user) {
      return response(404, { message: "User not found" });
    }

    const isPasswordCorrect = await bcrypt.compare(
      data.currentPassword,
      user.password
    );

    if (!isPasswordCorrect) {
      return response(400, { message: "Invalid password" });
    }

    const hashedNewPassword = await bcrypt.hash(data.newPassword, 10);

    const updateParams = {
      TableName: process.env.USERS_TABLE,
      Key: { id: userId },
      UpdateExpression: "set #password = :password",
      ExpressionAttributeNames: { "#password": "password" },
      ExpressionAttributeValues: {
        ":password": hashedNewPassword,
      },
    };

    await dynamoDb.update(updateParams);
    return response(200, { message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    return response(500, { message: "Couldn't update the password." });
  }
};
