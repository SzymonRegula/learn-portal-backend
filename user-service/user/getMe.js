import { response, getItemByUserId, getUserItem } from "../helpers/index.js";

export const handler = async (event) => {
  try {
    const { userId, role } = event.requestContext.authorizer.lambda;

    let responseData;

    if (role === "student") {
      const [user, student] = await Promise.all([
        getUserItem(userId),
        getItemByUserId(userId, process.env.STUDENTS_TABLE),
      ]);

      if (!user) {
        return response(404, { message: "User not found" });
      }

      responseData = {
        ...user,
        password: undefined,
        address: student.address,
        dateOfBirth: student.dateOfBirth,
        trainerIds: student.trainerIds,
      };
    }

    if (role === "trainer") {
      const [user, trainer] = await Promise.all([
        getUserItem(userId),
        getItemByUserId(userId, process.env.TRAINERS_TABLE),
      ]);

      if (!user) {
        return response(404, { message: "User not found" });
      }

      responseData = {
        ...user,
        password: undefined,
        specializationId: trainer.specializationId,
        specialization: trainer.specialization,
        studentIds: trainer.studentIds,
      };
    }

    return response(200, { data: responseData });
  } catch (error) {
    console.error(error);
    return response(500, { message: "Couldn't get the user" });
  }
};
