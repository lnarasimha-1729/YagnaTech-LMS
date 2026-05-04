const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'FrontendSetting',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      key: { type: DataTypes.STRING(255), allowNull: true },
      value: { type: DataTypes.TEXT('long'), allowNull: true },
    },
    { tableName: 'frontend_settings', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
