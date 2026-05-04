const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Lesson = sequelize.define('Lesson', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        title: { type: DataTypes.STRING(255) },
        user_id: { type: DataTypes.INTEGER },
        course_id: { type: DataTypes.INTEGER },
        section_id: { type: DataTypes.INTEGER },
        lesson_type: { type: DataTypes.STRING(255) },
        duration: { type: DataTypes.STRING(255) },
        total_mark: { type: DataTypes.INTEGER },
        pass_mark: { type: DataTypes.INTEGER },
        retake: { type: DataTypes.INTEGER },
        lesson_src: { type: DataTypes.STRING(255) },
        attachment: { type: DataTypes.TEXT('long') },
        attachment_type: { type: DataTypes.STRING(255) },
        video_type: { type: DataTypes.TEXT },
        thumbnail: { type: DataTypes.STRING(255) },
        is_free: { type: DataTypes.INTEGER },
        sort: { type: DataTypes.INTEGER },
        description: { type: DataTypes.TEXT('long') },
        summary: { type: DataTypes.TEXT('long') },
        status: { type: DataTypes.INTEGER },
    }, { tableName: 'lessons', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

    Lesson.associate = (models) => {
        Lesson.belongsTo(models.Course, { foreignKey: 'course_id' });
        Lesson.belongsTo(models.Section, { foreignKey: 'section_id' });
    };
    return Lesson;
};
