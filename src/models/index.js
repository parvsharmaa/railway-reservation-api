const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

const Train = sequelize.define(
  'Train',
  {
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    number: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },
  },
  {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

const Ticket = sequelize.define(
  'Ticket',
  {
    pnr: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM('CONFIRMED', 'RAC', 'WAITING'),
      allowNull: false,
    },
    total_fare: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    timestamps: true,
    createdAt: 'booking_date',
    updatedAt: false,
  }
);

const Passenger = sequelize.define('Passenger', {
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: false,
  },
  berth_preference: {
    type: DataTypes.ENUM('lower', 'upper', 'middle', 'none'),
    allowNull: true,
  },
  is_with_child: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

const Berth = sequelize.define('Berth', {
  coach_number: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  seat_number: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('LOWER', 'UPPER', 'MIDDLE', 'SIDE_LOWER'),
    allowNull: false,
  },
  is_allocated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

// Define relationships
Train.hasMany(Ticket);
Ticket.belongsTo(Train);

Ticket.hasMany(Passenger);
Passenger.belongsTo(Ticket);

Passenger.hasOne(Berth);
Berth.belongsTo(Passenger);

module.exports = {
  Train,
  Ticket,
  Passenger,
  Berth,
  sequelize,
};
