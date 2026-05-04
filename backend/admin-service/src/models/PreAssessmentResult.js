const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const PreAssessmentResult = sequelize.define('PreAssessmentResult', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        // BIGINT because user ids come from auth-service (different DB) and can
        // exceed INT range. No FK to admin-service's users table for the same reason.
        user_id: { type: DataTypes.BIGINT, allowNull: false },
        program_id: { type: DataTypes.INTEGER, allowNull: true },
        score: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
        passed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    }, {
        tableName: 'pre_assessment_results',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [{ fields: ['user_id', 'program_id'] }],
    });

    return PreAssessmentResult;
};
