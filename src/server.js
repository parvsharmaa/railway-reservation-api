require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');
const { sequelize } = require('./models');
const BerthService = require('./services/berth.service');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Connect to database first
    await connectDB();
    logger.info('Database connected successfully');

    // Sync models
    await sequelize.sync({ alter: true });
    logger.info('Database models synced');

    // Initialize berths
    await BerthService.initializeBerths();
    logger.info('Berths initialized');

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
