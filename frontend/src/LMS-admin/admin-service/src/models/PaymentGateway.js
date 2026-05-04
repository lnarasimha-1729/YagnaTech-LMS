const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'PaymentGateway',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      title: { type: DataTypes.STRING(100), allowNull: false },
      identifier: { type: DataTypes.STRING(100), allowNull: true },
      keys: { type: DataTypes.TEXT('long'), allowNull: true },
      logo: { type: DataTypes.STRING(255), allowNull: true },
      mode: { type: DataTypes.STRING(50), allowNull: true },
      status: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 },
    },
    { tableName: 'payment_gateways', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
