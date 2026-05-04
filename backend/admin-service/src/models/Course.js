const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Course = sequelize.define('Course', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        title: { type: DataTypes.STRING(255), allowNull: false },
        slug: { type: DataTypes.STRING(255) },
        short_description: { type: DataTypes.TEXT },
        user_id: { type: DataTypes.INTEGER },
        category_id: { type: DataTypes.INTEGER },
        course_type: { type: DataTypes.STRING(50), defaultValue: 'general' },
        status: { type: DataTypes.STRING(50), defaultValue: 'active' },
        level: { type: DataTypes.STRING(50) },
        language: { type: DataTypes.STRING(50) },
        is_paid: { type: DataTypes.BOOLEAN, defaultValue: false },
        is_best: { type: DataTypes.BOOLEAN, defaultValue: false },
        price: { type: DataTypes.FLOAT, defaultValue: 0 },
        discounted_price: { type: DataTypes.FLOAT, defaultValue: 0 },
        discount_flag: { type: DataTypes.BOOLEAN, defaultValue: false },
        enable_drip_content: { type: DataTypes.BOOLEAN, defaultValue: false },
        drip_content_settings: { type: DataTypes.TEXT },
        meta_keywords: { type: DataTypes.TEXT },
        meta_description: { type: DataTypes.TEXT },
        thumbnail: { type: DataTypes.STRING(255) },
        banner: { type: DataTypes.STRING(255) },
        preview: { type: DataTypes.STRING(255) },
        description: { type: DataTypes.TEXT('long') },
        requirements: { type: DataTypes.TEXT },
        outcomes: { type: DataTypes.TEXT },
        faqs: { type: DataTypes.TEXT },
        instructor_ids: { type: DataTypes.TEXT },
        average_rating: { type: DataTypes.FLOAT, defaultValue: 0 },
        expiry_period: { type: DataTypes.INTEGER, allowNull: true },
    }, { tableName: 'courses', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

    Course.associate = (models) => {
        Course.belongsTo(models.Category, { foreignKey: 'category_id' });
        Course.belongsTo(models.User, { as: 'creator', foreignKey: 'user_id' });
    };

    return Course;
};
