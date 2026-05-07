const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'MessageThread',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      code: { type: DataTypes.STRING(255), allowNull: true },
      contact_one: { type: DataTypes.INTEGER, allowNull: true },
      contact_two: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'message_threads', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
