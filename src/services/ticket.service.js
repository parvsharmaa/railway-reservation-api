const { Ticket, Passenger, Berth, sequelize } = require('../models');
const BerthService = require('./berth.service');
const logger = require('../utils/logger');
const redis = require('../config/redis');
const { generatePNR } = require('../utils/helpers');

class TicketService {
  static async bookTicket(trainId, passengers) {
    try {
      return await sequelize.transaction(async (t) => {
        // Check and classify passengers
        const adultPassengers = passengers.filter((p) => p.age >= 5);
        const children = passengers.filter((p) => p.age < 5);

        // Calculate fare (simplified for example)
        const baseFare = 500;
        const totalFare = adultPassengers.length * baseFare;

        // Check available capacity
        const availableBerths = await BerthService.getAvailableBerths();
        const totalAvailable = Object.values(availableBerths).reduce(
          (a, b) => a + b,
          0
        );

        let status;
        if (adultPassengers.length === 0) {
          status = 'CONFIRMED'; // Only children, no berth needed
        } else if (totalAvailable >= adultPassengers.length) {
          status = 'CONFIRMED';
        } else if (totalAvailable + 9 >= adultPassengers.length) {
          // RAC capacity
          status = 'RAC';
        } else if (totalAvailable + 9 + 10 >= adultPassengers.length) {
          // WL capacity
          status = 'WAITING';
        } else {
          throw new Error('No tickets available');
        }

        // Create ticket
        const ticket = await Ticket.create(
          {
            pnr: generatePNR(),
            train_id: trainId,
            status,
            total_fare: totalFare,
          },
          { transaction: t }
        );

        // Process passengers
        for (const passengerData of passengers) {
          const passenger = await Passenger.create(
            {
              ticket_id: ticket.id,
              name: passengerData.name,
              age: passengerData.age,
              gender: passengerData.gender,
              berth_preference: passengerData.berthPreference,
              is_with_child: passengerData.isWithChild,
            },
            { transaction: t }
          );

          // Allocate berth only for passengers >= 5 years and if status is CONFIRMED or RAC
          if (
            passengerData.age >= 5 &&
            (status === 'CONFIRMED' || status === 'RAC')
          ) {
            const berth = await BerthService.allocateBerth(passenger, t);
            if (berth) {
              await berth.update(
                {
                  is_allocated: true,
                  passenger_id: passenger.id,
                },
                { transaction: t }
              );
            }
          }
        }

        const client = redis.getClient();
        // Invalidate cache
        await client.del('available_berths');

        return ticket;
      });
    } catch (error) {
      logger.error('Error booking ticket:', error);
      throw error;
    }
  }

  static async cancelTicket(ticketId) {
    try {
      return await sequelize.transaction(async (t) => {
        const ticket = await Ticket.findByPk(ticketId, {
          include: [
            {
              model: Passenger,
              include: [Berth],
            },
          ],
          transaction: t,
          lock: true,
        });

        if (!ticket) {
          throw new Error('Ticket not found');
        }

        // Free berths
        for (const passenger of ticket.Passengers) {
          if (passenger.Berth) {
            await passenger.Berth.update(
              {
                is_allocated: false,
                passenger_id: null,
              },
              { transaction: t }
            );
          }
        }

        // Handle promotion logic
        if (ticket.status === 'CONFIRMED') {
          // Promote oldest RAC to confirmed
          const oldestRac = await Ticket.findOne({
            where: { status: 'RAC' },
            order: [['booking_date', 'ASC']],
            transaction: t,
            lock: true,
          });

          if (oldestRac) {
            await oldestRac.update({ status: 'CONFIRMED' }, { transaction: t });

            // Allocate berths for promoted RAC passengers
            const racPassengers = await Passenger.findAll({
              where: { ticket_id: oldestRac.id },
              include: [Berth],
              transaction: t,
            });

            for (const passenger of racPassengers) {
              if (!passenger.Berth) {
                const berth = await BerthService.allocateBerth(passenger, t);
                if (berth) {
                  await berth.update(
                    {
                      is_allocated: true,
                      passenger_id: passenger.id,
                    },
                    { transaction: t }
                  );
                }
              }
            }

            // Promote oldest WL to RAC
            const oldestWaiting = await Ticket.findOne({
              where: { status: 'WAITING' },
              order: [['booking_date', 'ASC']],
              transaction: t,
              lock: true,
            });

            if (oldestWaiting) {
              await oldestWaiting.update({ status: 'RAC' }, { transaction: t });
            }
          }
        } else if (ticket.status === 'RAC') {
          // Promote oldest WL to RAC
          const oldestWaiting = await Ticket.findOne({
            where: { status: 'WAITING' },
            order: [['booking_date', 'ASC']],
            transaction: t,
            lock: true,
          });

          if (oldestWaiting) {
            await oldestWaiting.update({ status: 'RAC' }, { transaction: t });
          }
        }

        // Delete the ticket (or mark as cancelled)
        await ticket.destroy({ transaction: t });

        const client = redis.getClient();
        // Invalidate cache
        await client.del('available_berths');

        return { message: 'Ticket cancelled successfully' };
      });
    } catch (error) {
      logger.error('Error cancelling ticket:', error);
      throw error;
    }
  }

  static async getBookedTickets(status) {
    try {
      const whereClause = {};
      if (status) whereClause.status = status;

      return await Ticket.findAll({
        where: whereClause,
        include: [
          {
            model: Passenger,
            include: [Berth],
          },
        ],
        order: [['booking_date', 'DESC']],
      });
    } catch (error) {
      logger.error('Error fetching booked tickets:', error);
      throw error;
    }
  }

  static async getTicketByPnr(pnr) {
    try {
      return await Ticket.findOne({
        where: { pnr },
        include: [
          {
            model: Passenger,
            include: [Berth],
          },
        ],
      });
    } catch (error) {
      logger.error('Error fetching ticket by PNR:', error);
      throw error;
    }
  }
}

module.exports = TicketService;
