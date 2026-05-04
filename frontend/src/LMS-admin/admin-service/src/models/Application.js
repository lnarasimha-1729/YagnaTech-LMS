const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'Application',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      type: { type: DataTypes.STRING(100), allowNull: true },
      payload: { type: DataTypes.TEXT('long'), allowNull: true },
      status: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    },
    { tableName: 'applications', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
