const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'BootcampResource',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      module_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      title: { type: DataTypes.STRING(255), allowNull: true },
      upload_type: { type: DataTypes.STRING(255), allowNull: true },
      file: { type: DataTypes.STRING(255), allowNull: true },
      uploaded_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'bootcamp_resources', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
