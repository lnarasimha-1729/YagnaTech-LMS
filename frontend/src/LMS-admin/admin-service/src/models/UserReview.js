const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'UserReview',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      reviewee_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      rating: { type: DataTypes.INTEGER, allowNull: true },
      comment: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: 'user_reviews', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
