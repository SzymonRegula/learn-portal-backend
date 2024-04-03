import { response } from "../helpers/index.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import Joi from "joi";

const client = new DynamoDBClient();
const dynamoDb = DynamoDBDocument.from(client);

const schema = Joi.object({
  studentId: Joi.string().uuid().required(),
  trainerId: Joi.string().uuid().required(),
  studentName: Joi.string().required(),
  trainerName: Joi.string().required(),
  specialization: Joi.string().required(),
  date: Joi.string().isoDate().required(),
  name: Joi.string().required(),
  type: Joi.object({
    id: Joi.string().uuid().required(),
    trainingType: Joi.string().required(),
  }).required(),
  duration: Joi.number().min(0).required(),
  description: Joi.string().required().allow(""),
});

export const handler = async (event) => {
  try {
    const data = JSON.parse(event.body);

    const { error } = schema.validate(data);

    if (error) {
      console.error(error);
      return response(400, { message: error.details[0].message });
    }

    data.id = uuidv4();

    const trainingParams = {
      TableName: process.env.TRAININGS_TABLE,
      Item: data,
    };

    await dynamoDb.put(trainingParams);

    return response(200, { message: "Training added successfully" });
  } catch (error) {
    console.error(error);
    return response(500, { message: "Couldn't add the training" });
  }
};
