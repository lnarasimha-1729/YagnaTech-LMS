const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Category = sequelize.define('Category', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        parent_id: { type: DataTypes.INTEGER, allowNull: true },
        title: { type: DataTypes.STRING(255), allowNull: false },
        slug: { type: DataTypes.STRING(255) },
        icon: { type: DataTypes.STRING(255) },
        sort: { type: DataTypes.INTEGER, defaultValue: 0 },
        status: { type: DataTypes.STRING(50), defaultValue: 'active' },
        keywords: { type: DataTypes.STRING(400) },
        description: { type: DataTypes.STRING(500) },
        thumbnail: { type: DataTypes.STRING(255) },
        category_logo: { type: DataTypes.STRING(255) },
    }, { tableName: 'categories', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

    Category.associate = (models) => {
        Category.hasMany(models.Category, { as: 'childs', foreignKey: 'parent_id' });
        Category.belongsTo(models.Category, { as: 'parent', foreignKey: 'parent_id' });
        Category.hasMany(models.Course, { foreignKey: 'category_id' });
    };

    return Category;
};
