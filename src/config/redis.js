const { createClient } = require('redis');
const logger = require('../utils/logger');

class RedisClient {
  constructor() {
    this.client = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Too many retries for Redis connection');
            return new Error('Redis connection retry limit exceeded');
          }
          return Math.min(retries * 100, 5000);
        },
      },
    });

    this.isConnected = false;

    this.client.on('error', (err) => {
      logger.error(`Redis error: ${err}`);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      logger.info('Redis client connected and ready');
    });

    this.client.on('end', () => {
      this.isConnected = false;
      logger.warn('Redis client disconnected');
    });
  }

  async connect() {
    try {
      await this.client.connect();
      this.isConnected = true;
      return this.client;
    } catch (error) {
      logger.error('Redis connection error:', error);
      throw error;
    }
  }

  getClient() {
    if (!this.isConnected) {
      throw new Error('Redis client is not connected');
    }
    return this.client;
  }

  async disconnect() {
    try {
      await this.client.disconnect();
      this.isConnected = false;
    } catch (error) {
      logger.error('Redis disconnection error:', error);
    }
  }
}

const redis = new RedisClient();

module.exports = redis;
