const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`);

  // Handle Joi validation errors
  if (err.isJoi) {
    return res.status(400).json({
      error: {
        message: 'Validation error',
        details: err.details,
      },
    });
  }

  // Handle custom errors
  if (err.name === 'BookingError') {
    return res.status(err.statusCode || 400).json({
      error: {
        message: err.message,
      },
    });
  }

  // Handle database errors
  if (
    err.name === 'SequelizeValidationError' ||
    err.name === 'SequelizeUniqueConstraintError'
  ) {
    return res.status(400).json({
      error: {
        message: 'Database validation error',
        details: err.errors.map((e) => e.message),
      },
    });
  }

  // Handle other unexpected errors
  res.status(500).json({
    error: {
      message: 'Internal server error',
    },
  });
};

module.exports = errorHandler;
