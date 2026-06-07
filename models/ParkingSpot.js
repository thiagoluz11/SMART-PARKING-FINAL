const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

  const ParkingSpot = sequelize.define('ParkingSpot', {

    id_spot: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    number: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'free'
    },

    spot_type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'normal'
    },

    id_park: {
      type: DataTypes.INTEGER,
      allowNull: false
    }

  }, {

    tableName: 'parking_spots',
    timestamps: false

  });

  return ParkingSpot;

};