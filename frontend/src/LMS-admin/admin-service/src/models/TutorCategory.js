const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'TutorCategory',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(255), allowNull: true },
      slug: { type: DataTypes.STRING(255), allowNull: true },
      status: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'tutor_categories', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
