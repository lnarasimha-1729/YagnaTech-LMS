const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'Quiz',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      course_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      section_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      title: { type: DataTypes.STRING(255), allowNull: false },
      slug: { type: DataTypes.STRING(255), allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      total_marks: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
      pass_marks: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
      duration: { type: DataTypes.INTEGER, allowNull: true },
      serial: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
      status: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 },
    },
    {
      tableName: 'quizzes',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
};
