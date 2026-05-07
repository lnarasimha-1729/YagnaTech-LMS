const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'Coupon',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      code: { type: DataTypes.STRING(255), allowNull: true },
      discount: { type: DataTypes.DOUBLE, allowNull: true },
      expiry: { type: DataTypes.STRING(255), allowNull: true },
      status: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'coupons', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
