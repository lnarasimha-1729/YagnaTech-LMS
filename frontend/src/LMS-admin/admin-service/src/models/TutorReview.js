const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'TutorReview',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      tutor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      rating: { type: DataTypes.INTEGER, allowNull: true },
      comment: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: 'tutor_reviews', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
