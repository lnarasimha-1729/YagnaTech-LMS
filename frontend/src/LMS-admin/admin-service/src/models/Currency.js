const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'Currency',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(100), allowNull: false },
      code: { type: DataTypes.STRING(10), allowNull: false },
      symbol: { type: DataTypes.STRING(10), allowNull: true },
      rate: { type: DataTypes.DECIMAL(12, 6), allowNull: true },
      is_default: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
      status: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 },
    },
    { tableName: 'currencies', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
