const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Vehicle', {
        id_vehicle:    { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        license_plate: { type: DataTypes.STRING(20), unique: true },
        brand:         { type: DataTypes.STRING(50) },
        model:         { type: DataTypes.STRING(50) },
        color:         { type: DataTypes.STRING(30) },
        vehicle_type:  { type: DataTypes.STRING(30) }
    }, {
        tableName: 'vehicles',
        timestamps: true
    });
};