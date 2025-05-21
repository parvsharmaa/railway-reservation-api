# Railway Reservation API - Complete Documentation

## Overview

A RESTful API for managing railway ticket reservations with confirmed, RAC, and waiting list tickets.

## Features

- Book tickets with automatic berth allocation
- Cancel tickets with automatic promotion (RAC→Confirmed, Waiting→RAC)
- View booked and available tickets
- Priority allocation for senior citizens and ladies with children

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Cache**: Redis
- **Containerization**: Docker

## Setup

### Prerequisites

- Docker
- Docker Compose
- Node.js (v18+ recommended)

### Installation

1. Clone the repository
2. Create `.env` file:

   ```env
   NODE_ENV=development
   PORT=3000
   DB_HOST=db
   DB_PORT=5432
   DB_USER=railway
   DB_PASSWORD=railway123
   DB_NAME=railway_reservation
   REDIS_HOST=redis
   REDIS_PORT=6379
   JWT_SECRET=secret_key
   ```

3. Start services:

   ```bash
   docker-compose up -d --build
   ```

4. Initialize database:
   ```bash
   docker-compose exec db psql -U railway -d railway_reservation -f /docker-entrypoint-initdb.d/init.sql
   ```

## API Endpoints

### 1. Book a Ticket

**Endpoint**: `POST /api/v1/tickets/book`

**Request**:

```json
{
  "trainId": 1,
  "passengers": [
    {
      "name": "John Doe",
      "age": 30,
      "gender": "male",
      "berthPreference": "lower"
    }
  ]
}
```

**Success Response (201)**:

```json
{
  "message": "Ticket booked successfully",
  "data": {
    "id": 1,
    "pnr": "ABC123",
    "status": "CONFIRMED",
    "passengers": [
      {
        "name": "John Doe",
        "berth": {
          "type": "LOWER",
          "coach": "A1",
          "seat": "101"
        }
      }
    ]
  }
}
```

**Error Responses**:

- `400 Bad Request` - Invalid input
- `409 Conflict` - No tickets available

---

### 2. Cancel a Ticket

**Endpoint**: `POST /api/v1/tickets/cancel/:ticketId`

**Success Response (200)**:

```json
{
  "message": "Ticket cancelled successfully",
  "promoted": {
    "rac_to_confirmed": "PNR456",
    "waiting_to_rac": "PNR789"
  }
}
```

**Error Responses**:

- `404 Not Found` - Ticket not found
- `400 Bad Request` - Invalid ticket ID

---

### 3. View Booked Tickets

**Endpoint**: `GET /api/v1/tickets/booked`

**Query Params**:

- `?status=confirmed|rac|waiting` (optional filter)

**Success Response (200)**:

```json
{
  "data": [
    {
      "pnr": "ABC123",
      "status": "CONFIRMED",
      "passengers": [
        {
          "name": "John Doe",
          "berth": "A1-101 (LOWER)"
        }
      ]
    }
  ]
}
```

---

### 4. Check Available Tickets

**Endpoint**: `GET /api/v1/tickets/available`

**Success Response (200)**:

```json
{
  "data": {
    "available": {
      "LOWER": 20,
      "MIDDLE": 21,
      "UPPER": 21,
      "SIDE_LOWER": 8
    },
    "totals": {
      "confirmed": 63,
      "rac": 9,
      "waiting": 10
    }
  }
}
```

---

### 5. Get Ticket by PNR

**Endpoint**: `GET /api/v1/tickets/:pnr`

**Success Response (200)**:

```json
{
  "data": {
    "pnr": "ABC123",
    "status": "CONFIRMED",
    "trainId": 1,
    "passengers": [
      {
        "name": "John Doe",
        "age": 30,
        "berth": "A1-101 (LOWER)"
      }
    ]
  }
}
```

## Testing Flow

### 1. Check Initial Availability

```bash
curl http://localhost:3000/api/v1/tickets/available
```

### 2. Book a Ticket

```bash
curl -X POST http://localhost:3000/api/v1/tickets/book   -H "Content-Type: application/json"   -d '{
    "trainId": 1,
    "passengers": [
      {
        "name": "Alice",
        "age": 28,
        "gender": "female",
        "berthPreference": "lower"
      }
    ]
  }'
```

### 3. View Booked Tickets

```bash
curl http://localhost:3000/api/v1/tickets/booked
```

### 4. Cancel a Ticket

```bash
curl -X POST http://localhost:3000/api/v1/tickets/cancel/1
```

### 5. Verify Promotion

```bash
curl http://localhost:3000/api/v1/tickets/booked?status=confirmed
```

## Database Schema

### Tables

1. **berths**
   - `id` (SERIAL PK)
   - `coach_number` (VARCHAR)
   - `seat_number` (VARCHAR)
   - `type` (ENUM: LOWER, UPPER, MIDDLE, SIDE_LOWER)
   - `is_allocated` (BOOLEAN)

## Troubleshooting

### Common Issues

1. **Database connection errors**:

   ```bash
   docker-compose restart db
   ```

2. **Redis connection issues**:

   ```bash
   docker-compose restart redis
   ```

3. **Endpoint not responding**:
   ```bash
   docker-compose logs app
   ```

### Reset Everything

```bash
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

## License

MIT
