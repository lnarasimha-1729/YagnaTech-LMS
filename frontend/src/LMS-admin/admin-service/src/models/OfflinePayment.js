const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'OfflinePayment',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      item_type: { type: DataTypes.STRING(255), allowNull: true },
      items: { type: DataTypes.STRING(255), allowNull: true },
      tax: { type: DataTypes.DOUBLE, allowNull: true },
      total_amount: { type: DataTypes.DOUBLE, allowNull: true },
      coupon: { type: DataTypes.STRING(255), allowNull: true },
      phone_no: { type: DataTypes.STRING(255), allowNull: true },
      bank_no: { type: DataTypes.STRING(255), allowNull: true },
      doc: { type: DataTypes.STRING(255), allowNull: true },
      status: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    },
    { tableName: 'offline_payments', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
