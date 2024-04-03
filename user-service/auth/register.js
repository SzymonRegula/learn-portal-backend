import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import Joi from "joi";
import {
  response,
  checkIfEmailExists,
  checkIfUsernameExists,
  getSpecializationItem,
} from "../helpers/index.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient();
const dynamoDb = DynamoDBDocument.from(client);

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
  dateOfBirth: Joi.string().isoDate().allow(""),
  address: Joi.string().max(255).allow(""),
});

export const handler = async (event) => {
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

    data.userId = uuidv4();

    if (data.role === "student") {
      await addStudent(data);
    }

    if (data.role === "trainer") {
      const responseIfSpecializationNotFound = await tryAddTrainer(data);
      if (responseIfSpecializationNotFound) {
        return responseIfSpecializationNotFound;
      }
    }

    await addUser(data);

    return response(201, { message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    return response(500, { message: "Couldn't register the user" });
  }
};

const addStudent = async (data) => {
  const studentParams = {
    TableName: process.env.STUDENTS_TABLE,
    Item: {
      id: uuidv4(),
      userId: data.userId,
      firstName: data.firstName,
      lastName: data.lastName,
      isActive: true,
      dateOfBirth: data.dateOfBirth || "",
      address: data.address || "",
      trainerIds: [],
    },
  };

  await dynamoDb.put(studentParams);
};

const tryAddTrainer = async (data) => {
  const specialization = await getSpecializationItem(data.specializationId);

  if (!specialization) {
    return response(400, { message: "Specialization not found" });
  }

  const trainerParams = {
    TableName: process.env.TRAINERS_TABLE,
    Item: {
      id: uuidv4(),
      userId: data.userId,
      firstName: data.firstName,
      lastName: data.lastName,
      specializationId: data.specializationId,
      specialization: specialization.specialization,
      isActive: true,
      studentIds: [],
    },
  };

  await dynamoDb.put(trainerParams);
};

const addUser = async (data) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const userParams = {
    TableName: process.env.USERS_TABLE,
    Item: {
      id: data.userId,
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

  await dynamoDb.put(userParams);
};
