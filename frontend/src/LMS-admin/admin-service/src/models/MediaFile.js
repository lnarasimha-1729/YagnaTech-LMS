const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'MediaFile',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      file_name: { type: DataTypes.STRING(255), allowNull: true },
      file_path: { type: DataTypes.STRING(500), allowNull: true },
      file_type: { type: DataTypes.STRING(100), allowNull: true },
      file_size: { type: DataTypes.BIGINT, allowNull: true },
      disk: { type: DataTypes.STRING(50), allowNull: true },
    },
    { tableName: 'media_files', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
