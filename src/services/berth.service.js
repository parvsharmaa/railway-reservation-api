const { Berth, sequelize } = require('../models');
const logger = require('../utils/logger');
const redis = require('../config/redis');

class BerthService {
  static async initializeBerths() {
    try {
      const count = await Berth.count();
      if (count === 0) {
        await sequelize.transaction(async (t) => {
          // Create confirmed berths
          const confirmedBerths = [];
          for (let coach = 1; coach <= 3; coach++) {
            for (let seat = 1; seat <= 21; seat++) {
              let type;
              if (seat % 3 === 1) type = 'LOWER';
              else if (seat % 3 === 2) type = 'MIDDLE';
              else type = 'UPPER';

              confirmedBerths.push({
                coach_number: `A${coach}`,
                seat_number: `${coach}${seat.toString().padStart(2, '0')}`,
                type,
                is_allocated: false,
              });
            }
          }

          // Create RAC berths (side-lower)
          const racBerths = [];
          for (let coach = 1; coach <= 3; coach++) {
            for (let seat = 1; seat <= 3; seat++) {
              racBerths.push({
                coach_number: `R${coach}`,
                seat_number: `R${coach}${seat.toString().padStart(2, '0')}`,
                type: 'SIDE_LOWER',
                is_allocated: false,
              });
            }
          }

          await Berth.bulkCreate([...confirmedBerths, ...racBerths], {
            transaction: t,
          });
          logger.info('Berths initialized successfully');
        });
      }
    } catch (error) {
      logger.error('Error initializing berths:', error);
      throw error;
    }
  }

  static async getAvailableBerths() {
    const cacheKey = 'available_berths';
    try {
      const client = redis.getClient();
      const cachedData = await client.get(cacheKey);

      if (cachedData) return JSON.parse(cachedData);

      const result = await Berth.findAll({
        where: { is_allocated: false },
        attributes: [
          'type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        group: ['type'],
      });

      const availableBerths = result.reduce((acc, curr) => {
        acc[curr.type] = parseInt(curr.get('count'), 10);
        return acc;
      }, {});

      await client.setEx(cacheKey, 300, JSON.stringify(availableBerths));
      return availableBerths;
    } catch (error) {
      logger.error('Error getting available berths:', error);
      throw error;
    }
  }

  static async allocateBerth(passenger, transaction) {
    try {
      let whereClause = { is_allocated: false };

      // Priority allocation for seniors (60+) or ladies with children
      if (
        passenger.age >= 60 ||
        (passenger.gender === 'female' && passenger.is_with_child)
      ) {
        whereClause.type = 'LOWER';
      } else if (
        passenger.berth_preference &&
        passenger.berth_preference !== 'none'
      ) {
        whereClause.type = passenger.berth_preference.toUpperCase();
      }

      const berth = await Berth.findOne({
        where: whereClause,
        order: [['type', 'ASC']], // Try to get preferred type first
        lock: true,
        transaction,
      });

      if (!berth) {
        // Try any available berth if preferred not available
        const anyBerth = await Berth.findOne({
          where: { is_allocated: false },
          lock: true,
          transaction,
        });
        if (!anyBerth) return null;
        return anyBerth;
      }

      return berth;
    } catch (error) {
      logger.error('Error allocating berth:', error);
      throw error;
    }
  }
}

module.exports = BerthService;
