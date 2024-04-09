import bcrypt from "bcryptjs";
import Joi from "joi";
import jwt from "jsonwebtoken";
import { response } from "../helpers/index.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient();
const dynamoDb = DynamoDBDocument.from(client);

const schema = Joi.object({
  email: Joi.string().email(),
  username: Joi.string().min(3).max(30),
  password: Joi.string().min(6).max(30).required(),
}).or("email", "username");

export const handler = async (event) => {
  try {
    const data = JSON.parse(event.body);

    const { error } = schema.validate(data);

    if (error) {
      console.error(error);
      return response(401, { message: "Invalid login credentials" });
    }

    const params = {
      TableName: process.env.USERS_TABLE,
    };

    if (data.email) {
      params.IndexName = "EmailIndex";
      params.KeyConditionExpression = "email = :email";
      params.ExpressionAttributeValues = { ":email": data.email };
    } else if (data.username) {
      params.IndexName = "UsernameIndex";
      params.KeyConditionExpression = "username = :username";
      params.ExpressionAttributeValues = { ":username": data.username };
    }

    const users = await dynamoDb.query(params);

    if (users.Count === 0) {
      return response(401, { message: "Invalid login credentials" });
    }

    const user = users.Items[0];

    const passwordMatch = await bcrypt.compare(data.password, user.password);

    if (!passwordMatch) {
      return response(401, { message: "Invalid login credentials" });
    }

    const payload = {
      userId: user.id,
      role: user.role,
      roleId: user.roleId,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return response(200, token);
  } catch (error) {
    console.error(error);
    return response(500, { message: "Couldn't login the user" });
  }
};
