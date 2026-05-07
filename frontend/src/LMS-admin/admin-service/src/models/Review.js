const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'Review',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      course_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      bootcamp_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      rating: { type: DataTypes.INTEGER, allowNull: true },
      comment: { type: DataTypes.TEXT, allowNull: true },
      status: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 },
    },
    { tableName: 'reviews', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
