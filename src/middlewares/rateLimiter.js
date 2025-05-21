const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../config/redis');
const logger = require('../utils/logger');

// Create middleware factory function
const createRateLimiter = () => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redis.getClient().sendCommand(args),
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      logger.warn(`Rate limit exceeded for IP ${req.ip}`);
      res.status(options.statusCode).json({
        error: {
          message: options.message,
        },
      });
    },
    message: 'Too many requests, please try again later',
  });
};

module.exports = createRateLimiter;
