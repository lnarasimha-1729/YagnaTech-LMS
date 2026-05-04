const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'LiveClass',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      course_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      title: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      start_time: { type: DataTypes.DATE, allowNull: true },
      end_time: { type: DataTypes.DATE, allowNull: true },
      meeting_url: { type: DataTypes.TEXT, allowNull: true },
      provider: { type: DataTypes.STRING(50), allowNull: true },
      meeting_id: { type: DataTypes.STRING(255), allowNull: true },
      password: { type: DataTypes.STRING(255), allowNull: true },
    },
    { tableName: 'live_classes', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
