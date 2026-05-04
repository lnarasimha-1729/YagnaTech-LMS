const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'SeoField',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      course_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      blog_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      bootcamp_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      route: { type: DataTypes.STRING(255), allowNull: true },
      name_route: { type: DataTypes.STRING(255), allowNull: true },
      meta_title: { type: DataTypes.STRING(255), allowNull: true },
      meta_keywords: { type: DataTypes.TEXT, allowNull: true },
      meta_description: { type: DataTypes.TEXT, allowNull: true },
      meta_robot: { type: DataTypes.TEXT, allowNull: true },
      canonical_url: { type: DataTypes.STRING(255), allowNull: true },
      custom_url: { type: DataTypes.STRING(255), allowNull: true },
      json_ld: { type: DataTypes.TEXT('long'), allowNull: true },
      og_title: { type: DataTypes.STRING(255), allowNull: true },
      og_description: { type: DataTypes.TEXT, allowNull: true },
      og_image: { type: DataTypes.STRING(255), allowNull: true },
    },
    { tableName: 'seo_fields', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
