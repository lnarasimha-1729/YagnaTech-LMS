const { DataTypes } = require('sequelize');

/** `categories` — hierarchical course taxonomy. parent_id nullable → top-level. */
module.exports = (sequelize) => {
  return sequelize.define(
    'Category',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      title: { type: DataTypes.STRING(255), allowNull: false },
      slug: { type: DataTypes.STRING(255), allowNull: true },
      parent_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      icon: { type: DataTypes.STRING(255), allowNull: true },
      sort: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      status: { type: DataTypes.INTEGER, allowNull: true },
      keywords: { type: DataTypes.STRING(400), allowNull: true },
      description: { type: DataTypes.STRING(500), allowNull: true },
      thumbnail: { type: DataTypes.STRING(255), allowNull: true },
      category_logo: { type: DataTypes.STRING(255), allowNull: true },
    },
    {
      tableName: 'categories',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
};
