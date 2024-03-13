import { response, getItemByUserId, getUserItem } from "../helpers/index.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient();
const dynamoDb = DynamoDBDocument.from(client);

export const handler = async (event) => {
  try {
    const { userId } = event.requestContext.authorizer.lambda;

    let user = await getUserItem(userId);

    if (!user) {
      return response(404, { message: "User not found" });
    }

    delete user.password;

    if (user.role === "student") {
      const student = await getItemByUserId(userId, process.env.STUDENTS_TABLE);

      user = {
        ...user,
        address: student.address,
        dateOfBirth: student.dateOfBirth,
      };
    }

    if (user.role === "trainer") {
      const trainer = await getItemByUserId(userId, process.env.TRAINERS_TABLE);

      user = {
        ...user,
        specializationId: trainer.specializationId,
      };
    }

    return response(200, { user, message: "User found" });
  } catch (error) {
    console.error(error);
    return response(500, { message: "Couldn't get the user." });
  }
};
