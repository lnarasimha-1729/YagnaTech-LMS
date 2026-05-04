const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'CartItem',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      course_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      bootcamp_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      item_type: { type: DataTypes.STRING(50), allowNull: true },
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    },
    { tableName: 'cart_items', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
