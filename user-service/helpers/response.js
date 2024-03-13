const response = (statusCode, body) => {
  const response = {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
  };

  if (body !== undefined) {
    response.body = JSON.stringify(body);
  }

  return response;
};

export default response;
