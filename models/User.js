const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('User', {
        id_user: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name:          { type: DataTypes.STRING(100), allowNull: false },
        email:         { type: DataTypes.STRING(100), unique: true, validate: { isEmail: true } },
        password_hash: { type: DataTypes.STRING(255), allowNull: false },
        contact:       { type: DataTypes.STRING(20) },
        role:          { type: DataTypes.ENUM('USER', 'ADMIN'), defaultValue: 'USER' },
        account_status:{ type: DataTypes.ENUM('ACTIVE', 'BLOCK'), defaultValue: 'ACTIVE' }
    }, {
        tableName: 'users',
        timestamps: true
    });
};