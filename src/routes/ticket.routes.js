const express = require('express');
const TicketController = require('../controllers/ticket.controller');
const { bookTicketSchema } = require('../validations/ticket.validation');
const validateRequest = require('../middlewares/validateRequest');
const router = express.Router();

// POST /api/v1/tickets/book
router.post(
  '/book',
  validateRequest(bookTicketSchema),
  TicketController.bookTicket
);

// POST /api/v1/tickets/cancel/:ticketId
router.post('/cancel/:ticketId', TicketController.cancelTicket);

// GET /api/v1/tickets/booked
router.get('/booked', TicketController.getBookedTickets);

// GET /api/v1/tickets/available
router.get('/available', TicketController.getAvailableTickets);

// GET /api/v1/tickets/:pnr
router.get('/:pnr', TicketController.getTicketByPnr);

module.exports = router;
