const logger = require('../utils/logger');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
    });

    if (error) {
      logger.warn(`Request validation failed: ${error.message}`);
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          details: error.details.map((d) => d.message),
        },
      });
    }

    req.body = value;
    next();
  };
};

module.exports = validateRequest;
