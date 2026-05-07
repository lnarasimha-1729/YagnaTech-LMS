const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'WatchDuration',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      course_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      lesson_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      duration: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    },
    { tableName: 'watch_durations', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
