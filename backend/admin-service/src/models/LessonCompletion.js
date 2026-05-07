const { DataTypes } = require('sequelize');

// One row per (user, lesson) once the lesson is considered complete (auto at 30% or
// manual mark). Drives the sidebar tick marks. Course percentage is derived by
// counting these rows against total lessons in the course.
module.exports = (sequelize) => {
    const LessonCompletion = sequelize.define('LessonCompletion', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        user_id: { type: DataTypes.BIGINT, allowNull: false },
        course_id: { type: DataTypes.INTEGER, allowNull: false },
        lesson_id: { type: DataTypes.INTEGER, allowNull: false },
    }, {
        tableName: 'lesson_completions',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            { unique: true, fields: ['user_id', 'lesson_id'] },
            { fields: ['user_id', 'course_id'] },
        ],
    });

    return LessonCompletion;
};
