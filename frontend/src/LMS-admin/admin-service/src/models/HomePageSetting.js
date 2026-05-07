const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'HomePageSetting',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      value: { type: DataTypes.TEXT('long'), allowNull: true },
    },
    { tableName: 'home_page_settings', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
