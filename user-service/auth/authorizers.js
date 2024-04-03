import jwt from "jsonwebtoken";

const userAuthorizer = async (event) => {
  const policy = await generatePolicy(event);
  return policy;
};

const studentAuthorizer = async (event) => {
  const policy = await generatePolicy(event, "student");
  return policy;
};

const trainerAuthorizer = async (event) => {
  const policy = await generatePolicy(event, "trainer");
  return policy;
};

const generatePolicy = async (event, expectedRole) => {
  try {
    const authHeader =
      event.headers.Authorization || event.headers.authorization;

    if (!authHeader) {
      throw new Error("Token is required");
    }

    const [tokenType, token] = authHeader.split(" ");

    if (tokenType !== "Bearer") {
      throw new Error("Invalid token type");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let effect = "Deny";
    if (!expectedRole || expectedRole === decoded.role) {
      effect = "Allow";
    }

    const policy = {
      principalId: decoded.userId,
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: effect,
            Resource: event.routeArn,
          },
        ],
      },
      context: {
        userId: decoded.userId,
        role: decoded.role,
      },
    };

    return policy;
  } catch (error) {
    console.error(error);
    throw new Error("Unauthorized");
  }
};

export { userAuthorizer, studentAuthorizer, trainerAuthorizer };
