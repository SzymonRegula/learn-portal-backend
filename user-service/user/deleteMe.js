import { response, getItemByUserId } from "../helpers/index.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient();
const dynamoDb = DynamoDBDocument.from(client);

export const handler = async (event) => {
  try {
    const { userId, role } = event.requestContext.authorizer.lambda;

    const params = {
      TableName: process.env.USERS_TABLE,
      Key: { id: userId },
      ReturnValues: "ALL_OLD",
    };

    const result = await dynamoDb.delete(params);

    if (result.Attributes === undefined) {
      return response(404, { message: "User not found" });
    }

    if (role === "student") {
      const student = await getItemByUserId(userId, process.env.STUDENTS_TABLE);
      console.log(student);
      if (student) {
        await deleteItem(student.id, process.env.STUDENTS_TABLE);
      }
    }

    if (role === "trainer") {
      const trainer = await getItemByUserId(userId, process.env.TRAINERS_TABLE);
      console.log(trainer);
      if (trainer) {
        await deleteItem(trainer.id, process.env.TRAINERS_TABLE);
      }
    }

    return response(200, { message: "Account deleted successfully" });
  } catch (error) {
    console.error(error);
    return response(500, { message: "Couldn't delete the user." });
  }
};

const deleteItem = async (id, tableName) => {
  const params = {
    TableName: tableName,
    Key: { id },
  };

  return dynamoDb.delete(params);
};
