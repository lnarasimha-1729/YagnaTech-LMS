const { DataTypes } = require('sequelize');

/** Laravel notifications table (UUID id). */
module.exports = (sequelize) => {
  return sequelize.define(
    'Notification',
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      type: { type: DataTypes.STRING(255), allowNull: false },
      notifiable_type: { type: DataTypes.STRING(255), allowNull: false },
      notifiable_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      data: { type: DataTypes.TEXT, allowNull: true },
      read_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'notifications', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
