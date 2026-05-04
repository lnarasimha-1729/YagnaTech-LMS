const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'WatchHistory',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      course_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      lesson_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      is_completed: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
    },
    { tableName: 'watch_histories', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
