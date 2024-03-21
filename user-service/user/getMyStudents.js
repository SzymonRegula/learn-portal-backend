import { getItemByUserId, getUserItem, response } from "../helpers/index.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient();
const dynamoDb = DynamoDBDocument.from(client);

export const handler = async (event) => {
  try {
    const { userId } = event.requestContext.authorizer.lambda;

    const trainer = await getItemByUserId(userId, process.env.TRAINERS_TABLE);

    if (!trainer) {
      return response(404, { message: "Trainer not found" });
    }

    const { studentIds } = trainer;

    console.log("ids: ", studentIds);

    if (studentIds.length === 0) {
      return response(404, { students: [], message: "There are no students" });
    }

    const keys = studentIds.map((id) => ({ id }));

    const params = {
      RequestItems: {
        [process.env.STUDENTS_TABLE]: {
          Keys: keys,
        },
      },
    };

    const studentsResponse = await dynamoDb.batchGet(params);

    const students = studentsResponse.Responses[process.env.STUDENTS_TABLE];

    if (!students || students.length === 0) {
      return response(404, { students: [], message: "Students not found" });
    }

    const responseData = students.map((student) => ({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      isActive: student.isActive,
    }));

    return response(200, { students: responseData, message: "Students found" });
  } catch (error) {
    console.error(error);
    return response(500, { message: "Couldn't get the students" });
  }
};
