const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

  const ParkingPark = sequelize.define('ParkingPark', {

    id_park: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },

    address: {
      type: DataTypes.STRING(150),
      allowNull: false
    },

    city: {
      type: DataTypes.STRING(80),
      allowNull: false
    },

    total_capacity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    opening_time: {
      type: DataTypes.TIME,
      allowNull: false
    },

    closing_time: {
      type: DataTypes.TIME,
      allowNull: false
    },

    lat: {
      type: DataTypes.DECIMAL(10, 8)
    },

    lng: {
      type: DataTypes.DECIMAL(11, 8)
    },
    img:{
      type: DataTypes.STRING(255),
      allowNull: true
    },
    price_per_hour: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 1.50
    },
    daily_ticket_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    }

  }, {

    tableName: 'parking_parks',
    timestamps: false

  });

  return ParkingPark;

};