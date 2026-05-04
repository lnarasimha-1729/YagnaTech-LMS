const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('SeoField', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        course_id: { type: DataTypes.INTEGER },
        route: { type: DataTypes.STRING(255) },
        name_route: { type: DataTypes.STRING(255) },
        meta_title: { type: DataTypes.STRING(255) },
        meta_description: { type: DataTypes.TEXT },
        meta_keywords: { type: DataTypes.TEXT },
        meta_robot: { type: DataTypes.STRING(100) },
        canonical_url: { type: DataTypes.STRING(255) },
        custom_url: { type: DataTypes.STRING(255) },
        json_ld: { type: DataTypes.TEXT },
        og_title: { type: DataTypes.STRING(255) },
        og_description: { type: DataTypes.TEXT },
        og_image: { type: DataTypes.STRING(255) },
    }, { tableName: 'seo_fields', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
};
