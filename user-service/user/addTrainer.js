import { getItemByUserId, getTrainerItem, response } from "../helpers/index.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import Joi from "joi";

const client = new DynamoDBClient();
const dynamoDb = DynamoDBDocument.from(client);

const schema = Joi.object({
  trainerId: Joi.string().uuid().required(),
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

    const [student, trainer] = await Promise.all([
      getItemByUserId(userId, process.env.STUDENTS_TABLE),
      getTrainerItem(body.trainerId),
    ]);

    if (!student) {
      return response(404, { message: "Student not found" });
    }

    if (!trainer) {
      return response(404, { message: "Trainer not found" });
    }

    if (student.trainerIds.includes(body.trainerId)) {
      return response(400, { message: "Trainer already added" });
    } else if (!trainer.isActive) {
      return response(400, { message: "Trainer is not active" });
    }

    const studentUpdateParams = {
      TableName: process.env.STUDENTS_TABLE,
      Key: { id: student.id },
      UpdateExpression: "set #trainerIds = :data",
      ExpressionAttributeNames: { "#trainerIds": "trainerIds" },
      ExpressionAttributeValues: {
        ":data": [...student.trainerIds, body.trainerId],
      },
    };

    const trainerUpdateParams = {
      TableName: process.env.TRAINERS_TABLE,
      Key: { id: trainer.id },
      UpdateExpression: "set #studentIds = :data",
      ExpressionAttributeNames: { "#studentIds": "studentIds" },
      ExpressionAttributeValues: {
        ":data": [...trainer.studentIds, student.id],
      },
    };

    await Promise.all([
      dynamoDb.update(studentUpdateParams),
      dynamoDb.update(trainerUpdateParams),
    ]);
    return response(200, { message: "Trainer added successfully" });
  } catch (error) {
    console.error(error);
    return response(500, { message: "Couldn't add the trainer" });
  }
};
