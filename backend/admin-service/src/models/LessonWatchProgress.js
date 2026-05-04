const { DataTypes } = require('sequelize');

// One row per (user, lesson). current_duration is the highest playback second the
// user has reached — used to compute the 30% completion rule and to resume the
// video at the right spot when they revisit.
module.exports = (sequelize) => {
    const LessonWatchProgress = sequelize.define('LessonWatchProgress', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        user_id: { type: DataTypes.BIGINT, allowNull: false },
        course_id: { type: DataTypes.INTEGER, allowNull: false },
        lesson_id: { type: DataTypes.INTEGER, allowNull: false },
        current_duration: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    }, {
        tableName: 'lesson_watch_progress',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            { unique: true, fields: ['user_id', 'lesson_id'] },
            { fields: ['user_id', 'course_id'] },
        ],
    });

    return LessonWatchProgress;
};
