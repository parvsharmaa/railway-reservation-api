const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/error.handler');
const requestLogger = require('./middlewares/requestLogger');
const createRateLimiter = require('./middlewares/rateLimiter');
const ticketRoutes = require('./routes/ticket.routes');
const redis = require('./config/redis');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Initialize rate limiter after Redis is connected
const initializeMiddlewares = async () => {
  try {
    await redis.connect();
    app.use(createRateLimiter());

    // Routes
    app.use('/api/v1/tickets', ticketRoutes);

    // Health check
    app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        redis: redis.isConnected ? 'connected' : 'disconnected',
      });
    });

    // Error handling
    app.use(errorHandler);
  } catch (error) {
    logger.error('Failed to initialize middlewares:', error);
    process.exit(1);
  }
};

initializeMiddlewares();

module.exports = app;
