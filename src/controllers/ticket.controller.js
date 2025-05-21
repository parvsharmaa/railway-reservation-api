const TicketService = require('../services/ticket.service');
const BerthService = require('../services/berth.service');
const { bookTicketSchema } = require('../validations/ticket.validation');
const logger = require('../utils/logger');

class TicketController {
  static async bookTicket(req, res, next) {
    try {
      // Validate request body
      const { error, value } = bookTicketSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: {
            message: 'Validation failed',
            details: error.details,
          },
        });
      }

      const { trainId, passengers } = value;
      const ticket = await TicketService.bookTicket(trainId, passengers);

      res.status(201).json({
        message: 'Ticket booked successfully',
        data: ticket,
      });
    } catch (error) {
      logger.error('Ticket booking error:', error);
      next(error);
    }
  }

  static async cancelTicket(req, res, next) {
    try {
      const { ticketId } = req.params;
      const result = await TicketService.cancelTicket(ticketId);

      res.json({
        message: result.message,
      });
    } catch (error) {
      logger.error('Ticket cancellation error:', error);
      next(error);
    }
  }

  static async getBookedTickets(req, res, next) {
    try {
      const { status } = req.query;
      const tickets = await TicketService.getBookedTickets(status);

      res.json({
        data: tickets,
      });
    } catch (error) {
      logger.error('Error fetching booked tickets:', error);
      next(error);
    }
  }

  static async getAvailableTickets(req, res, next) {
    try {
      const availableBerths = await BerthService.getAvailableBerths();

      res.json({
        data: {
          available: availableBerths,
          total_confirmed: 63,
          total_rac: 9,
          total_waiting: 10,
        },
      });
    } catch (error) {
      logger.error('Error fetching available tickets:', error);
      next(error);
    }
  }

  static async getTicketByPnr(req, res, next) {
    try {
      const { pnr } = req.params;
      const ticket = await TicketService.getTicketByPnr(pnr);

      if (!ticket) {
        return res.status(404).json({
          error: {
            message: 'Ticket not found',
          },
        });
      }

      res.json({
        data: ticket,
      });
    } catch (error) {
      logger.error('Error fetching ticket by PNR:', error);
      next(error);
    }
  }
}

module.exports = TicketController;
