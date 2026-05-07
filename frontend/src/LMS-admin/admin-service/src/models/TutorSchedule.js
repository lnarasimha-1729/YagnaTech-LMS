const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'TutorSchedule',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      tutor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      category_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      subject_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      start_time: { type: DataTypes.STRING(255), allowNull: true },
      end_time: { type: DataTypes.STRING(255), allowNull: true },
      tution_type: { type: DataTypes.INTEGER, allowNull: true },
      duration: { type: DataTypes.INTEGER, allowNull: true },
      description: { type: DataTypes.TEXT('long'), allowNull: true },
      status: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
      booking_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    },
    { tableName: 'tutor_schedules', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
