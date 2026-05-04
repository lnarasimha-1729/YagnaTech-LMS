const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Setting', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        type: { type: DataTypes.STRING(255) },
        description: { type: DataTypes.TEXT('long') },
    }, { tableName: 'settings', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
};
