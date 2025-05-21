const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn('Authentication failed: No token provided');
    return res.status(401).json({
      error: {
        message: 'Authentication required',
      },
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('Authentication failed: Invalid token');
      return res.status(403).json({
        error: {
          message: 'Invalid token',
        },
      });
    }

    req.user = user;
    next();
  });
};

const authorize = (roles = []) => {
  return (req, res, next) => {
    if (roles.length && !roles.includes(req.user.role)) {
      logger.warn(`Authorization failed: User ${req.user.id} not authorized`);
      return res.status(403).json({
        error: {
          message: 'Unauthorized access',
        },
      });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
