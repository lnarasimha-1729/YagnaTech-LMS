const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'Enrollment',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      course_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      enrollment_type: { type: DataTypes.STRING(255), allowNull: true },
      entry_date: { type: DataTypes.INTEGER, allowNull: true },
      expiry_date: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'enrollments', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
