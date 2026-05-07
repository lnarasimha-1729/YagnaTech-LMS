const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'NotificationSetting',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      label: { type: DataTypes.STRING(255), allowNull: true },
      is_enabled: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1 },
    },
    { tableName: 'notification_settings', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
