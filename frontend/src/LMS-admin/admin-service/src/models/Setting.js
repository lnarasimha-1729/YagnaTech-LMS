const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'Setting',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      type: { type: DataTypes.STRING(255), allowNull: true },
      description: { type: DataTypes.TEXT('long'), allowNull: true },
    },
    { tableName: 'settings', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
