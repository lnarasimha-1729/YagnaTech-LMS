const { DataTypes } = require('sequelize');

/**
 * Issued certificates. One row per (user_id, course_id) pair, created when a
 * student finishes a course (PlayerController@track_lesson_progress in Laravel).
 * Fields beyond the original migration:
 *   - title / description: optional metadata for the Coupon-style admin table.
 *   - template_image: legacy slot used by the table CRUD; the template that's
 *     rendered into downloads is the one in `settings.certificate_template`.
 *   - status: 1 = active/visible to student, 0 = hidden.
 */
module.exports = (sequelize) => {
    const Certificate = sequelize.define('Certificate', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        // String to accommodate auth-service's userId format (e.g. "usr_abc123").
        user_id: { type: DataTypes.STRING(255), allowNull: true },
        course_id: { type: DataTypes.INTEGER, allowNull: true },
        identifier: { type: DataTypes.STRING(100), allowNull: true, unique: true },
        title: { type: DataTypes.STRING(255), allowNull: true },
        description: { type: DataTypes.TEXT, allowNull: true },
        template_image: { type: DataTypes.STRING(255), allowNull: true },
        status: { type: DataTypes.TINYINT, defaultValue: 1 },
        issued_at: { type: DataTypes.DATE, allowNull: true },
    }, { tableName: 'certificates', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

    Certificate.associate = (models) => {
        Certificate.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        Certificate.belongsTo(models.Course, { foreignKey: 'course_id', as: 'course' });
    };
    return Certificate;
};
