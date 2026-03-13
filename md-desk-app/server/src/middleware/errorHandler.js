function errorHandler(error, request, reply) {
  request.log.error(error);

  const statusCode = error.statusCode ?? 500;
  const message = error.message ?? 'Internal Server Error';

  if (error.validation) {
    return reply.status(400).send({
      success: false,
      message: 'Validation error',
      errors: error.validation,
    });
  }

  return reply.status(statusCode).send({
    success: false,
    message: statusCode === 500 ? 'Internal Server Error' : message,
  });
}

module.exports = { errorHandler };
