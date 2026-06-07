const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

  return sequelize.define('FavoritePark', {

    id_user: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },

    id_park: {
      type: DataTypes.INTEGER,
      primaryKey: true
    }

  }, {

    tableName: 'favorite_parks',
    timestamps: false

  });

};