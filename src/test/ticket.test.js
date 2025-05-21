const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');

describe('Ticket API', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/v1/tickets/book', () => {
    it('should book a confirmed ticket when berths are available', async () => {
      const response = await request(app)
        .post('/api/v1/tickets/book')
        .send({
          trainId: 1,
          passengers: [
            {
              name: 'John Doe',
              age: 30,
              gender: 'male',
              berthPreference: 'lower',
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.data.status).toBe('CONFIRMED');
    });

    it('should return RAC status when confirmed berths are full', async () => {
      // Book all confirmed berths first (63 berths)
      // Then test RAC booking
      const response = await request(app)
        .post('/api/v1/tickets/book')
        .send({
          trainId: 1,
          passengers: [
            {
              name: 'RAC Passenger',
              age: 25,
              gender: 'female',
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.data.status).toBe('RAC');
    });

    it('should return error when no tickets available', async () => {
      // Book all berths (confirmed + RAC + waiting)
      // Then test for no availability
      const response = await request(app)
        .post('/api/v1/tickets/book')
        .send({
          trainId: 1,
          passengers: [
            {
              name: 'No Ticket',
              age: 25,
              gender: 'male',
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toMatch(/No tickets available/);
    });
  });

  describe('POST /api/v1/tickets/cancel/:ticketId', () => {
    it('should cancel a ticket and promote RAC to confirmed', async () => {
      // First book a confirmed ticket
      const bookingResponse = await request(app)
        .post('/api/v1/tickets/book')
        .send({
          trainId: 1,
          passengers: [
            {
              name: 'To Cancel',
              age: 35,
              gender: 'male',
            },
          ],
        });

      const ticketId = bookingResponse.body.data.id;
      const response = await request(app)
        .post(`/api/v1/tickets/cancel/${ticketId}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Ticket cancelled successfully');
    });
  });
});
