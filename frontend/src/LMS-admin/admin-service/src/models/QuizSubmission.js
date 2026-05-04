const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'QuizSubmission',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      quiz_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      course_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      answers: { type: DataTypes.TEXT('long'), allowNull: true },
      score: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
      total_marks: { type: DataTypes.INTEGER, allowNull: true },
      submitted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'quiz_submissions',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
};
