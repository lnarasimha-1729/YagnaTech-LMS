const { DataTypes } = require('sequelize');

/**
 * Student course ratings. One row per (user_id, course_id) pair — a student can
 * rate a course exactly once (enforced by the unique index + the service's
 * "already rated" guard). A rating is 1–5 stars with an optional written review,
 * and is only accepted once the student has completed the course (checked in the
 * service against watch progress). The course-details page aggregates these into
 * average_rating / review_count and lists them in its Reviews section.
 *
 * user_id is a STRING to accommodate auth-service's userId format (e.g.
 * "usr_abc123"), matching the Certificate model.
 */
module.exports = (sequelize) => {
    const CourseReview = sequelize.define('CourseReview', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        user_id: { type: DataTypes.STRING(255), allowNull: false },
        course_id: { type: DataTypes.INTEGER, allowNull: false },
        // Cached display name so the Reviews list doesn't need a cross-DB join
        // to the auth users table on every course-details read.
        user_name: { type: DataTypes.STRING(255), allowNull: true },
        rating: { type: DataTypes.TINYINT, allowNull: false },
        review: { type: DataTypes.TEXT, allowNull: true },
    }, {
        tableName: 'course_reviews',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            // One rating per student per course.
            { unique: true, name: 'course_reviews_user_course_unique', fields: ['user_id', 'course_id'] },
        ],
    });

    CourseReview.associate = (models) => {
        CourseReview.belongsTo(models.Course, { foreignKey: 'course_id', as: 'course' });
    };

    return CourseReview;
};
