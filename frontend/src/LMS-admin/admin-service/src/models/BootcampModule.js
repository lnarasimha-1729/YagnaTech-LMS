const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'BootcampModule',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      bootcamp_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      title: { type: DataTypes.STRING(255), allowNull: true },
      publish_date: { type: DataTypes.INTEGER, allowNull: true },
      expiry_date: { type: DataTypes.INTEGER, allowNull: true },
      restriction: { type: DataTypes.STRING(255), allowNull: true },
      sort: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'bootcamp_modules', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
