const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'Message',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      thread_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      sender_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      receiver_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      message: { type: DataTypes.TEXT('long'), allowNull: true },
      read: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    },
    { tableName: 'messages', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
