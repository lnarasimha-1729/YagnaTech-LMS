const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'Wishlist',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      course_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      bootcamp_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    },
    { tableName: 'wishlists', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
