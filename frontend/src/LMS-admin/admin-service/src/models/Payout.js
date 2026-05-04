const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'Payout',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      method: { type: DataTypes.STRING(100), allowNull: true },
      note: { type: DataTypes.TEXT, allowNull: true },
      status: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
      paid_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'payouts', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
