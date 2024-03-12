"use strict";

const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const AWS = require("aws-sdk");
const { response } = require("../helpers/response");

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const schema = Joi.object({
  firstName: Joi.string().min(2).max(30).required(),
  lastName: Joi.string().min(2).max(30).required(),
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(30).required(),
  photo: Joi.string().uri(),
  role: Joi.string().valid("student", "trainer").required(),
  specializationId: Joi.string().uuid().when("role", {
    is: "trainer",
    then: Joi.required(),
  }),
  dateOfBirth: Joi.string().isoDate(),
  address: Joi.string().max(255),
});

module.exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body);

    const { error } = schema.validate(data);

    if (error) {
      console.error(error);
      return response(400, { message: error.details[0].message });
    }

    const [usernameExists, emailExists] = await Promise.all([
      checkIfUsernameExists(data.username),
      checkIfEmailExists(data.email),
    ]);

    if (usernameExists) {
      return response(400, { message: "Username already exists" });
    }

    if (emailExists) {
      return response(400, { message: "Email already exists" });
    }

    const userId = uuidv4();

    if (data.role === "student") {
      await addStudent(userId, data.dateOfBirth, data.address);
    }

    if (data.role === "trainer") {
      const error = await tryAddTrainer(userId, data.specializationId);
      if (error) {
        return error;
      }
    }

    await addUser(userId, data);

    return response(201, { message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    return response(500, { message: "Couldn't register the user." });
  }
};

const addStudent = async (userId, dateOfBirth, address) => {
  const studentParams = {
    TableName: process.env.STUDENTS_TABLE,
    Item: {
      id: uuidv4(),
      userId,
      dateOfBirth: dateOfBirth || "",
      address: address || "",
    },
  };

  await dynamoDb.put(studentParams).promise();
};

const tryAddTrainer = async (userId, specializationId) => {
  const specializationParams = {
    TableName: process.env.SPECIALIZATIONS_TABLE,
    Key: { id: specializationId },
  };

  const specializationResult = await dynamoDb
    .get(specializationParams)
    .promise();

  if (!specializationResult.Item) {
    return response(400, { message: "Specialization not found" });
  }

  const trainerParams = {
    TableName: process.env.TRAINERS_TABLE,
    Item: {
      id: uuidv4(),
      userId,
      specializationId,
    },
  };

  await dynamoDb.put(trainerParams).promise();
};

const addUser = async (userId, data) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const userParams = {
    TableName: process.env.USERS_TABLE,
    Item: {
      id: userId,
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      isActive: true,
      photo: data.photo || "",
    },
  };

  await dynamoDb.put(userParams).promise();
};

const checkIfUsernameExists = async (username) => {
  const usernameParams = {
    TableName: process.env.USERS_TABLE,
    IndexName: "UsernameIndex",
    KeyConditionExpression: "username = :username",
    ExpressionAttributeValues: {
      ":username": username,
    },
  };

  const usernameResult = await dynamoDb.query(usernameParams).promise();

  if (usernameResult.Items && usernameResult.Items.length > 0) {
    return true;
  }
  return false;
};

const checkIfEmailExists = async (email) => {
  const emailParams = {
    TableName: process.env.USERS_TABLE,
    IndexName: "EmailIndex",
    KeyConditionExpression: "email = :email",
    ExpressionAttributeValues: {
      ":email": email,
    },
  };

  const emailResult = await dynamoDb.query(emailParams).promise();

  if (emailResult.Items && emailResult.Items.length > 0) {
    return true;
  }
  return false;
};
