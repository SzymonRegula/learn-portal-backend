import {
  response,
  checkIfEmailExists,
  checkIfUsernameExists,
  getSpecializationItem,
  getItemByUserId,
} from "../helpers/index.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import Joi from "joi";

const client = new DynamoDBClient();
const dynamoDb = DynamoDBDocument.from(client);

const commonSchema = Joi.object({
  firstName: Joi.string().min(2).max(30),
  lastName: Joi.string().min(2).max(30),
  username: Joi.string().min(3).max(30),
  email: Joi.string().email(),
  isActive: Joi.boolean(),
});

const studentSchema = commonSchema.keys({
  address: Joi.string().max(255).allow(""),
  dateOfBirth: Joi.string().isoDate().allow(""),
});

const trainerSchema = commonSchema.keys({
  specializationId: Joi.string().uuid(),
});

export const handler = async (event) => {
  try {
    const { userId, role } = event.requestContext.authorizer.lambda;

    const schema = role === "student" ? studentSchema : trainerSchema;

    const data = JSON.parse(event.body);

    const { error } = schema.validate(data);

    if (error) {
      console.error(error);
      return response(400, { message: error.details[0].message });
    }

    const userUpdateData = {};
    const roleUpdateData = {};

    if (data.hasOwnProperty("firstName")) {
      userUpdateData.firstName = data.firstName;
      roleUpdateData.firstName = data.firstName;
    }
    if (data.hasOwnProperty("lastName")) {
      userUpdateData.lastName = data.lastName;
      roleUpdateData.lastName = data.lastName;
    }
    if (data.hasOwnProperty("username")) {
      if (await checkIfUsernameExists(data.username)) {
        return response(400, { message: "Username already exists" });
      }
      userUpdateData.username = data.username;
    }
    if (data.hasOwnProperty("email")) {
      if (await checkIfEmailExists(data.email)) {
        return response(400, { message: "Email already exists" });
      }
      userUpdateData.email = data.email;
    }
    if (data.hasOwnProperty("isActive")) {
      userUpdateData.isActive = data.isActive;
      roleUpdateData.isActive = data.isActive;
    }
    if (data.hasOwnProperty("address")) {
      roleUpdateData.address = data.address;
    }
    if (data.hasOwnProperty("dateOfBirth")) {
      roleUpdateData.dateOfBirth = data.dateOfBirth;
    }
    if (data.hasOwnProperty("specializationId")) {
      const specialization = await getSpecializationItem(data.specializationId);

      if (!specialization) {
        return response(404, { message: "Specialization not found" });
      }
      roleUpdateData.specializationId = data.specializationId;
      roleUpdateData.specialization = specialization.specialization;
    }

    const updateUserPromise = getUserUpdateParams(userUpdateData, userId);

    const updateRolePromise = await getRoleUpdateParams(
      roleUpdateData,
      userId,
      role
    );

    const [updateUserResponse, updateRoleResponse] = await Promise.all([
      updateUserPromise,
      updateRolePromise,
    ]);

    const updatedData = {
      ...updateUserResponse?.Attributes,
      ...updateRoleResponse?.Attributes,
    };

    return response(200, updatedData);
  } catch (error) {
    console.error(error);
    return response(500, { message: "Couldn't update the data" });
  }
};

const generateUpdateParams = (data, id, tableName) => {
  let updateExpression = "set";
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  for (const prop in data) {
    updateExpression += ` #${prop} = :${prop},`;
    expressionAttributeNames[`#${prop}`] = prop;
    expressionAttributeValues[`:${prop}`] = data[prop];
  }

  updateExpression = updateExpression.slice(0, -1); // remove the last comma

  const updateUserParams = {
    TableName: tableName,
    Key: { id },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "UPDATED_NEW",
  };

  return updateUserParams;
};

const getRoleUpdateParams = async (data, userId, role) => {
  if (Object.keys(data).length !== 0) {
    let id;
    let tableName;

    if (role === "student") {
      const student = await getItemByUserId(userId, process.env.STUDENTS_TABLE);
      id = student.id;
      tableName = process.env.STUDENTS_TABLE;
    }
    if (role === "trainer") {
      const trainer = await getItemByUserId(userId, process.env.TRAINERS_TABLE);
      id = trainer.id;
      tableName = process.env.TRAINERS_TABLE;
    }

    const updateRoleParams = generateUpdateParams(data, id, tableName);

    return dynamoDb.update(updateRoleParams);
  }
};

const getUserUpdateParams = (data, userId) => {
  if (Object.keys(data).length !== 0) {
    const updateUserParams = generateUpdateParams(
      data,
      userId,
      process.env.USERS_TABLE
    );

    return dynamoDb.update(updateUserParams);
  }
};
