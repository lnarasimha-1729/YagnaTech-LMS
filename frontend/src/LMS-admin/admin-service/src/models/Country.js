const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'Country',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(100), allowNull: false },
      short_name: { type: DataTypes.STRING(10), allowNull: true },
      phone_code: { type: DataTypes.STRING(10), allowNull: true },
      status: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 },
    },
    { tableName: 'countries', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
