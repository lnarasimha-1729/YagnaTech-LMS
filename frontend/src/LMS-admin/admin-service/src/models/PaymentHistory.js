const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'PaymentHistory',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      payment_type: { type: DataTypes.STRING(50), allowNull: true },
      course_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      amount: { type: DataTypes.DOUBLE, allowNull: true },
      invoice: { type: DataTypes.STRING(255), allowNull: true },
      date_added: { type: DataTypes.INTEGER, allowNull: true },
      last_modified: { type: DataTypes.INTEGER, allowNull: true },
      admin_revenue: { type: DataTypes.STRING(255), allowNull: true },
      instructor_revenue: { type: DataTypes.STRING(255), allowNull: true },
      tax: { type: DataTypes.DOUBLE, allowNull: true },
      instructor_payment_status: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
      transaction_id: { type: DataTypes.STRING(255), allowNull: true },
      session_id: { type: DataTypes.STRING(255), allowNull: true },
      coupon: { type: DataTypes.STRING(255), allowNull: true },
    },
    { tableName: 'payment_histories', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
