const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'TeamPackageMember',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      purchase_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      email: { type: DataTypes.STRING(255), allowNull: true },
      invited_at: { type: DataTypes.DATE, allowNull: true },
      joined_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'team_package_members', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
