const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'Language',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(100), allowNull: false },
      short_name: { type: DataTypes.STRING(10), allowNull: true },
      is_default: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
      is_rtl: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
      status: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 },
    },
    { tableName: 'languages', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
