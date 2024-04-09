import { response } from "../helpers/index.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import Joi from "joi";

const client = new DynamoDBClient();
const dynamoDb = DynamoDBDocument.from(client);

const schema = Joi.object({
  studentId: Joi.string().uuid(),
  trainerId: Joi.string().uuid(),
  studentName: Joi.string().when("studentId", {
    is: Joi.exist(),
    then: Joi.forbidden(),
    otherwise: Joi.optional(),
  }),
  trainerName: Joi.string().when("trainerId", {
    is: Joi.exist(),
    then: Joi.forbidden(),
    otherwise: Joi.optional(),
  }),
  specialization: Joi.string().when("trainerId", {
    is: Joi.exist(),
    then: Joi.forbidden(),
    otherwise: Joi.optional(),
  }),
  from: Joi.string().isoDate(),
  to: Joi.string().isoDate(),
}).xor("studentId", "trainerId");

export const handler = async (event) => {
  try {
    const data = event.queryStringParameters;

    const { error } = schema.validate(data);

    if (error) {
      console.error(error);
      return response(400, { message: error.details[0].message });
    }

    const params = {
      TableName: process.env.TRAININGS_TABLE,
    };

    if (data.studentId) {
      params.IndexName = "StudentIdIndex";
      params.KeyConditionExpression = "studentId = :studentId";
      params.ExpressionAttributeValues = { ":studentId": data.studentId };
    } else if (data.trainerId) {
      params.IndexName = "TrainerIdIndex";
      params.KeyConditionExpression = "trainerId = :trainerId";
      params.ExpressionAttributeValues = { ":trainerId": data.trainerId };
    }

    const trainingsResponse = await dynamoDb.query(params);

    let trainings = trainingsResponse.Items;

    if (trainings.length === 0) {
      return response(404, {
        message: "There are no trainings",
      });
    }

    if (data.studentName) {
      trainings = filterStringValue(trainings, "studentName", data.studentName);
    }

    if (data.trainerName) {
      trainings = filterStringValue(trainings, "trainerName", data.trainerName);
    }

    if (data.specialization) {
      trainings = filterStringValue(
        trainings,
        "specialization",
        data.specialization
      );
    }

    if (data.from) {
      trainings = trainings.filter((training) => {
        const finishDate = addDays(training.date, training.duration);
        return finishDate >= data.from;
      });
    }

    if (data.to) {
      trainings = trainings.filter((training) => training.date <= data.to);
    }

    return response(200, trainings);
  } catch (error) {
    console.error(error);
    return response(500, { message: "Couldn't get the trainings" });
  }
};

const filterStringValue = (trainings, key, value) =>
  trainings.filter((training) =>
    training[key].trim().toLowerCase().includes(value.trim().toLowerCase())
  );

const addDays = (isoDate, daysToAdd) => {
  const originalDate = new Date(isoDate);
  originalDate.setDate(originalDate.getDate() + daysToAdd);
  return originalDate.toISOString();
};
