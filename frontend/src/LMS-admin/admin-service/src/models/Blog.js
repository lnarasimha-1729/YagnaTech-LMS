const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'Blog',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      category_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      title: { type: DataTypes.STRING(255), allowNull: false },
      slug: { type: DataTypes.STRING(255), allowNull: true },
      short_description: { type: DataTypes.TEXT, allowNull: true },
      description: { type: DataTypes.TEXT('long'), allowNull: true },
      thumbnail: { type: DataTypes.STRING(255), allowNull: true },
      tags: { type: DataTypes.TEXT, allowNull: true },
      views: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
      status: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 },
    },
    {
      tableName: 'blogs',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
};
