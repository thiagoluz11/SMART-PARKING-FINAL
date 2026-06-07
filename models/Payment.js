const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

  return sequelize.define('Payment', {

    id_payment: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    id_reservation: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    amount: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },

    payment_method: {
      type: DataTypes.STRING(50)
    },

    payment_status: {
      type: DataTypes.STRING(30)
    },

    payment_date: {
      type: DataTypes.DATE
    }

  }, {

    tableName: 'payments',
    timestamps: false

  });

};