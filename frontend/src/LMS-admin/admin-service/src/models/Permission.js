const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'Permission',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      role: { type: DataTypes.STRING(100), allowNull: false },
      permission_key: { type: DataTypes.STRING(255), allowNull: false },
    },
    { tableName: 'permissions', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
