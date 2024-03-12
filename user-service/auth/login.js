"use strict";

const bcrypt = require("bcryptjs");
const Joi = require("joi");
const AWS = require("aws-sdk");
const jwt = require("jsonwebtoken");
const { response } = require("../helpers/response");

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(30).required(),
});

module.exports.handler = async (event) => {
  const data = JSON.parse(event.body);

  const { error } = schema.validate(data);

  if (error) {
    console.error(error);
    return response(401, { message: "Invalid login credentials" });
  }

  const params = {
    TableName: process.env.USERS_TABLE,
    IndexName: "EmailIndex",
    KeyConditionExpression: "email = :email",
    ExpressionAttributeValues: {
      ":email": data.email,
    },
  };

  const users = await dynamoDb.query(params).promise();

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
    username: user.username,
    role: user.role,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

  return response(200, { token, message: "Login successful" });
};
