const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'BlogComment',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      blog_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      parent_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      comment: { type: DataTypes.TEXT, allowNull: false },
      status: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 },
    },
    { tableName: 'blog_comments', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
