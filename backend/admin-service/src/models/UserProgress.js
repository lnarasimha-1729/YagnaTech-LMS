const { DataTypes } = require('sequelize');

// Tracks a user's progress through a program: which program they picked, which
// course they enrolled in, and the last lesson they watched. One row per
// (user_id, program_id) — user can hold one enrollment per program.
module.exports = (sequelize) => {
    const UserProgress = sequelize.define('UserProgress', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        // BIGINT because auth-service issues numeric ids that exceed INT range
        // (storing them as INT clamps to 2,147,483,647 and collapses every user into one).
        user_id: { type: DataTypes.BIGINT, allowNull: false },
        program_id: { type: DataTypes.INTEGER, allowNull: false },
        course_id: { type: DataTypes.INTEGER, allowNull: true },
        last_lesson_id: { type: DataTypes.INTEGER, allowNull: true },
        enrolled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    }, {
        tableName: 'user_progress',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            { unique: true, fields: ['user_id', 'program_id'] },
            { fields: ['user_id'] },
        ],
    });

    return UserProgress;
};
