const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('LiveClass', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        user_id: { type: DataTypes.INTEGER },
        course_id: { type: DataTypes.INTEGER },
        class_topic: { type: DataTypes.STRING(255) },
        provider: { type: DataTypes.STRING(255) },
        class_date_and_time: { type: DataTypes.DATE },
        additional_info: { type: DataTypes.TEXT('long') },
        note: { type: DataTypes.TEXT },
    }, { tableName: 'live_classes', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
};
