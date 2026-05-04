const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'Certificate',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      course_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      bootcamp_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      identifier: { type: DataTypes.STRING(100), allowNull: true, unique: true },
      title: { type: DataTypes.STRING(255), allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      template_image: { type: DataTypes.STRING(255), allowNull: true },
      status: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 },
      issued_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'certificates', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
