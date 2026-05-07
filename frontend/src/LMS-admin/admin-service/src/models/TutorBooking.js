const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'TutorBooking',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      invoice: { type: DataTypes.STRING(255), allowNull: true },
      schedule_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      student_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      tutor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      start_time: { type: DataTypes.STRING(255), allowNull: true },
      end_time: { type: DataTypes.STRING(255), allowNull: true },
      joining_data: { type: DataTypes.TEXT('long'), allowNull: true },
      price: { type: DataTypes.DOUBLE, allowNull: true },
      admin_revenue: { type: DataTypes.DOUBLE, allowNull: true },
      instructor_revenue: { type: DataTypes.DOUBLE, allowNull: true },
      tax: { type: DataTypes.DOUBLE, allowNull: true },
      payment_method: { type: DataTypes.STRING(255), allowNull: true },
      payment_details: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: 'tutor_bookings', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
