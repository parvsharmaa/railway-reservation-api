const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    retry: {
      max: 5,
      timeout: 5000,
      match: [
        /ConnectionError/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
      ],
    },
  }
);

const connectDB = async () => {
  let retries = 5;
  while (retries > 0) {
    try {
      await sequelize.authenticate();
      logger.info('Database connection established successfully.');
      return;
    } catch (error) {
      retries--;
      logger.warn(`Database connection failed. ${retries} retries left...`);
      await new Promise((res) => setTimeout(res, 5000));
    }
  }
  logger.error('Unable to connect to the database after multiple retries');
  process.exit(1);
};

module.exports = { sequelize, connectDB };
