const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'BuilderPage',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(255), allowNull: true },
      html: { type: DataTypes.TEXT('long'), allowNull: true },
      identifier: { type: DataTypes.STRING(255), allowNull: true },
      is_permanent: { type: DataTypes.INTEGER, allowNull: true },
      status: { type: DataTypes.INTEGER, allowNull: true },
      edit_home_id: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'builder_pages', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
