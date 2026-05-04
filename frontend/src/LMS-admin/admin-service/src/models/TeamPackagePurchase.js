const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'TeamPackagePurchase',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      invoice: { type: DataTypes.STRING(255), allowNull: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      package_id: { type: DataTypes.INTEGER, allowNull: true },
      price: { type: DataTypes.DOUBLE, allowNull: true },
      admin_revenue: { type: DataTypes.DOUBLE, allowNull: true },
      instructor_revenue: { type: DataTypes.DOUBLE, allowNull: true },
      tax: { type: DataTypes.DOUBLE, allowNull: true },
      payment_method: { type: DataTypes.STRING(255), allowNull: true },
      payment_details: { type: DataTypes.TEXT, allowNull: true },
      status: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'team_package_purchases', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
