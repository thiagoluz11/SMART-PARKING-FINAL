const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

  return sequelize.define('Reservation', {

    id_reservation: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    id_spot: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    id_vehicle: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },

    start_time: {
      type: DataTypes.TIME,
      allowNull: false
    },

    end_time: {
      type: DataTypes.TIME,
      allowNull: false
    },

    status: {
      type: DataTypes.STRING(30),
      defaultValue: 'active'
    }

  }, {

    tableName: 'reservations',
    timestamps: false

  });

};