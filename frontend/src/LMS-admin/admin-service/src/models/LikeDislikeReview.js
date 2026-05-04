const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'LikeDislikeReview',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      review_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      type: { type: DataTypes.STRING(10), allowNull: false },
    },
    { tableName: 'like_dislike_reviews', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
